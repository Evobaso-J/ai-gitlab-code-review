import { FastifyPluginAsync } from "fastify";
import { OpenAI } from "openai";
import { postAIComment } from "./utils.js";
import { FetchHeaders, GitLabError, GitLabWebhookHandler, SupportedWebhookEvent } from "./types.js";
import { handlePushHook } from "./hookHandlers/push.js";
import { handleMergeRequestHook } from "./hookHandlers/mergeRequest.js";



const gitlabWebhook: FastifyPluginAsync = async (fastify, opts): Promise<void> => {

    fastify.post('/', async function (request, reply) {
        const gitlabUrl = new URL(fastify.env.GITLAB_URL);
        const openaiInstance = new OpenAI({
            apiKey: fastify.env.OPENAI_API_KEY,
        });
        const AIModel = fastify.env.AI_MODEL;

        if (request.headers['X-Gitlab-Token'] !== fastify.env.GITLAB_TOKEN) {
            reply.code(401).send({ error: 'Unauthorized' });
            return;
        }

        const payload = request.body as SupportedWebhookEvent;
        const headers: FetchHeaders = { 'private-token': fastify.env.GITLAB_TOKEN };

        try {
            /**
             * Each handler has to return a prompt. 
             * The prompt is built by fetching:
             * 
             * 1. The changes in the branch
             * 2. The files before the edit
             */

            let result: Awaited<ReturnType<GitLabWebhookHandler>> = new GitLabError({
                name: "UNSUPPORTED_EVENT_TYPE",
                message: `Webhook events of type "${payload.object_kind}" are not supported`,
            });
            if (payload.object_kind === 'push') {
                result = await handlePushHook(payload, {
                    AIModel,
                    gitlabUrl,
                    headers,
                    openaiInstance,
                })
            }
            if (payload.object_kind === 'merge_request') {
                result = await handleMergeRequestHook(payload, {
                    AIModel,
                    gitlabUrl,
                    headers,
                    openaiInstance,
                })
            }

            if (result instanceof Error) throw result;
            const { commentPayload, gitLabBaseUrl, mergeRequestIid } = result;

            // Post the comment
            const aiComment = postAIComment({
                gitLabBaseUrl,
                mergeRequestIid,
                headers,
            }, commentPayload);
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