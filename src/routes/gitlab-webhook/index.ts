import { WebhookPushEventSchema, WebhookMergeRequestEventSchema, CommitDiffSchema } from "@gitbeaker/rest";
import { FastifyPluginAsync } from "fastify";
import { buildAnswer, buildPrompt } from "./prompt.js";
import { OpenAI } from "openai";
import { ChatCompletion } from "openai/resources/index.mjs";

const gitlabWebhook: FastifyPluginAsync = async (fastify, opts): Promise<void> => {

    fastify.post('/', async function (request, reply) {
        const gitlabToken = fastify.env.GITLAB_TOKEN;
        const gitlabUrl = fastify.env.GITLAB_URL;

        if (request.headers['X-Gitlab-Token'] !== gitlabToken) {
            reply.code(401).send({ error: 'Unauthorized' });
            return;
        }

        const payload = request.body as
            | WebhookPushEventSchema
            | WebhookMergeRequestEventSchema;

        if (payload.object_kind !== 'push' && payload.object_kind !== 'merge_request') {
            reply.code(400).send({ error: 'Unsupported event type' });
            return;
        }
        const headers = { 'private-token': gitlabToken };
        let commentUrl = "";
        let commentPayload: { "body": string } | { note: string } | undefined;

        if (payload.object_kind === 'push') {
            const {
                project_id: projectId,
                after: commitSha,
            } = payload;
            const commitUrl = `${gitlabUrl}/projects/${projectId}/repository/commits/${commitSha}/diff`;

            let changes: CommitDiffSchema[] | undefined;
            try {
                changes = (await (
                    await fetch(commitUrl, { headers })
                ).json()) as CommitDiffSchema[];
            } catch (error) {
                fastify.log.error("Failed to fetch commit diff", error);
            }

            if (!changes) {
                fastify.log.error("Failed to fetch commit diff");
                reply.code(500).send({ error: "Internal server error" });
                return;
            }

            // transform the changes into a list of old file urls for a fetch request
            const oldFilesRequestUrls = changes.map(path =>
                `${gitlabUrl}/projects/${projectId}/repository/files/${encodeURIComponent(path.old_path)}/raw`
            );

            // fetch the old files

            let oldFiles: string[] = [];
            try {
                oldFiles = await Promise.all(
                    oldFilesRequestUrls.map(async url => {
                        const response = await fetch(url, { headers });
                        return response.text();
                    })
                );
            } catch (error) {
                fastify.log.error("Failed to fetch old files", error);
            }

            if (!oldFiles) {
                fastify.log.error("Failed to fetch old files");
                reply.code(500).send({ error: "Internal server error" });
                return;
            }

            commentUrl = `${gitlabUrl}/projects/${projectId}/merge_requests/${commitSha}/notes`;

            const { messages } = buildPrompt(oldFiles, changes);

            const openai = new OpenAI({
                apiKey: fastify.env.OPENAI_API_KEY,
            });

            let completion: ChatCompletion | Error | undefined;
            try {
                completion = await openai.chat.completions.create(
                    {
                        model: fastify.env.AI_MODEL,
                        temperature: 0.7,
                        stream: false,
                        messages
                    }
                )

            } catch (error) {
                if (error instanceof Error) {
                    completion = error;
                }
                fastify.log.error("Failed to generate completion", error);
            }

            const answer = buildAnswer(completion);
            commentPayload = { note: answer };
        }

        // Post the comment
        try {
            await fetch(commentUrl, {
                method: "POST",
                headers,
                body: JSON.stringify(commentPayload),
            });
        } catch (error) {
            fastify.log.error("Failed to post comment", error);
            reply.code(500).send({ error: "Internal server error" });
            return;
        }

        reply.code(200).send({ status: "OK" });
    })
}

export default gitlabWebhook;