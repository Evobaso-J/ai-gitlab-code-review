import type { FastifyPluginAsync, RequestParamsDefault, RequestQuerystringDefault } from "fastify";
import { OpenAI } from "openai";
import { generateAICompletion, postAIComment } from "./utils.js";
import { GitLabError, type FetchHeaders, type GitLabWebhookHandler, type SupportedWebhookEvent } from "./types.js";
import { handlePushHook, handleMergeRequestHook, buildCommentPayload } from "./hookHandlers.js";
import { buildAnswer } from "./prompt.js";


type GitLabWebhookRequest = {
    Body?: SupportedWebhookEvent;
    Querystring?: RequestQuerystringDefault;
    Params?: RequestParamsDefault;
    Headers?: {
        'x-gitlab-token': string
    };
}

const gitlabWebhook: FastifyPluginAsync = async (fastify): Promise<void> => {
    fastify.post<GitLabWebhookRequest>('/', async function ({ headers: reqHeaders, body }, reply) {
        const gitlabUrl = new URL(fastify.env.GITLAB_URL);
        const openaiInstance = new OpenAI({
            apiKey: fastify.env.OPENAI_API_KEY,
        });
        const AIModel = fastify.env.AI_MODEL;
        if (reqHeaders['x-gitlab-token'] !== fastify.env.GITLAB_TOKEN) {
            reply.code(401).send({ error: 'Unauthorized' });
            return;
        }
        if (!body) {
            reply.code(400).send({ error: 'Bad Request' });
            return;
        }

        const headers: FetchHeaders = { 'private-token': fastify.env.GITLAB_TOKEN };

        let result: Awaited<ReturnType<GitLabWebhookHandler>> = new GitLabError({
            name: "UNSUPPORTED_EVENT_TYPE",
            message: `Webhook events of type "${body.object_kind}" are not supported`,
        });

        // FETCH NEEDED PARAMS FOR AI COMPLETION
        try {
            /**
             * Each handler has to return a prompt. 
             * The prompt is built by fetching:
             * 
             * 1. The changes in the branch
             * 2. The files before the edit
             */

            if (body.object_kind === 'push') {
                result = await handlePushHook(body, {
                    gitlabUrl,
                    headers,
                })
            }
            if (body.object_kind === 'merge_request') {
                result = await handleMergeRequestHook(body, {
                    gitlabUrl,
                    headers,
                })
            }

        } catch (error) {
            if (error instanceof Error) {
                fastify.log.error(error.message, error);
                reply.code(500).send({ result: error });
                return;
            }
        }
        if (result instanceof Error) throw result;

        // We return a 200 OK to GitLab to avoid 
        // the webhook to timeout due to the AI completion
        // taking too long
        reply.code(200).send({ status: "OK" });

        try {
            // CREATE AI COMMENT
            const { messageParams, gitLabBaseUrl, mergeRequestIid } = result;
            const completion = await generateAICompletion(messageParams, openaiInstance, AIModel);

            const answer = buildAnswer(completion);
            const commentPayload = buildCommentPayload(answer, body.object_kind);

            // POST COMMENT ON MERGE REQUEST
            const aiComment = postAIComment({
                gitLabBaseUrl,
                mergeRequestIid,
                headers,
            }, commentPayload);
            if (aiComment instanceof Error) throw aiComment;

        } catch (error) {
            if (error instanceof Error) {
                fastify.log.error(error.message, error);
                return;
            }
        }
    })
}

export default gitlabWebhook;