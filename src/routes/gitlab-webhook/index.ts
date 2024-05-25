import { WebhookPushEventSchema, WebhookMergeRequestEventSchema } from "@gitbeaker/rest";
import { FastifyPluginAsync } from "fastify";
import { buildAnswer, buildPrompt } from "./prompt.js";
import { OpenAI } from "openai";
import { fetchCommitDiff, fetchPreEditFiles, generateAICompletion, postAIComment } from "./utils.js";

export type FetchHeaders = {
    'private-token': string;
}
export type CommentPayload = { "body": string } | { note: string } | undefined;


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
        const headers: FetchHeaders = { 'private-token': gitlabToken };
        let commentPayload: { "body": string } | { note: string } | undefined;
        let commentUrl: URL = new URL(gitlabUrl);

        try {
            if (payload.object_kind === 'push') {
                const {
                    project_id: projectId,
                    after: commitSha,
                } = payload;

                const gitLabBaseUrl = new URL(`${gitlabUrl}/projects/${projectId}`);
                commentUrl = new URL(`merge_requests/${commitSha}/notes`, gitLabBaseUrl);

                // Get the commit diff
                const commitUrl = new URL(`repository/commits/${commitSha}/diff`, gitLabBaseUrl);

                const changes = await fetchCommitDiff(commitUrl, headers);
                if (changes instanceof Error) throw changes;

                // transform the changes into a list of old file urls for a fetch request
                const oldFilesRequestUrls = changes.map(path =>
                    new URL(`repository/files/${encodeURIComponent(path.old_path)}/raw`, gitLabBaseUrl)
                );

                // Fetch files before the edit
                const oldFiles = await fetchPreEditFiles(oldFilesRequestUrls, headers);
                if (oldFiles instanceof Error) throw oldFiles;

                const messages = buildPrompt(oldFiles, changes);

                const openai = new OpenAI({
                    apiKey: fastify.env.OPENAI_API_KEY,
                });

                const completion = await generateAICompletion(messages, openai, fastify.env.AI_MODEL);
                if (completion instanceof Error) throw completion;


                const answer = buildAnswer(completion);
                commentPayload = { note: answer };
            }

            // Post the comment
            const aiComment = postAIComment(new URL(commentUrl), headers, commentPayload);
            if (aiComment instanceof Error) throw aiComment;

        } catch (error) {
            if (error instanceof Error) {
                fastify.log.error(error.message, error);
                reply.code(500).send(error);
                return;
            }
        }

        reply.code(200).send({ status: "OK" });
    })
}

export default gitlabWebhook;