import type { FastifyPluginAsync, RequestParamsDefault, RequestQuerystringDefault } from "fastify";
import { OpenAI } from "openai";
import { generateAICompletion, postAIComment } from "./services.js";
import { GitLabError, type GitLabFetchHeaders, type GitLabWebhookHandlerReturnType, type SupportedWebhookEvent } from "./types.js";
import { handlePushHook, handleMergeRequestHook, buildCommentPayload } from "./hookHandlers.js";
import { buildAnswer } from "../../config/prompt.js";


type GitLabWebhookRequest = {
    Body?: SupportedWebhookEvent;
    Querystring?: RequestQuerystringDefault;
    Params?: RequestParamsDefault;
    Headers?: {
        'x-gitlab-token': string
    };
}

declare module 'fastify' {
    // Extension from decorator
    interface FastifyInstance {
        gitLabWebhookHandlerResult: GitLabWebhookHandlerReturnType
        gitLabFetchHeaders: GitLabFetchHeaders
    }
}

const gitlabWebhook: FastifyPluginAsync = async (fastify): Promise<void> => {
    fastify
        .decorate<GitLabWebhookHandlerReturnType>('gitLabWebhookHandlerResult',
            new GitLabError({
                name: "UNSUPPORTED_EVENT_TYPE",
                message: `Webhook event type not supported`,
            })
        )
        .decorate<GitLabFetchHeaders>('gitLabFetchHeaders', {
            'private-token': fastify.env.GITLAB_TOKEN
        })
        .post<GitLabWebhookRequest>('/', async function (request, reply) {
            const gitlabUrl = new URL(fastify.env.GITLAB_URL);

            if (request.headers['x-gitlab-token'] !== fastify.env.GITLAB_TOKEN) {
                reply.code(401).send({ error: 'Unauthorized' });
                return;
            }
            if (!request.body) {
                reply.code(400).send({ error: 'Bad Request' });
                return;
            }



            // FETCH NEEDED PARAMS FOR AI COMPLETION
            try {
                /**
                 * Each handler has to return a prompt. 
                 * The prompt is built by fetching:
                 * 
                 * 1. The changes in the branch
                 * 2. The files before the edit
                 */

                if (request.body.object_kind === 'push') {
                    fastify.gitLabWebhookHandlerResult = await handlePushHook(request.body, {
                        gitlabUrl,
                        headers: fastify.gitLabFetchHeaders,
                    })
                }
                if (request.body.object_kind === 'merge_request') {
                    fastify.gitLabWebhookHandlerResult = await handleMergeRequestHook(request.body, {
                        gitlabUrl,
                        headers: fastify.gitLabFetchHeaders,
                    })
                }

            } catch (error) {
                if (error instanceof Error) {
                    fastify.log.error(error.message, error);
                    reply.code(500).send({ result: error });
                    return;
                }
            }
            // We return a 200 OK to GitLab to avoid 
            // the webhook to timeout due to the AI completion
            // taking too long
            reply.code(200).send({ status: "OK" });
        })
        // CREATE AI COMMENT AND POST IT ON MERGE REQUEST
        .addHook<GitLabWebhookRequest>('onResponse',
            async (request, reply) => {
                if (request.headers['x-gitlab-token'] !== fastify.env.GITLAB_TOKEN) {
                    reply.code(401).send({ error: 'Unauthorized' });
                    return;
                }
                if (!request.body) {
                    reply.code(400).send({ error: 'Bad Request' });
                    return;
                }

                if (fastify.gitLabWebhookHandlerResult instanceof Error) throw fastify.gitLabWebhookHandlerResult;

                if (!fastify.gitLabWebhookHandlerResult) return;

                // CREATE AI COMMENT
                const { messageParams, gitLabBaseUrl, mergeRequestIid } = fastify.gitLabWebhookHandlerResult;

                try {
                    const openaiInstance = new OpenAI({
                        apiKey: fastify.env.OPENAI_API_KEY,
                    });
                    const AIModel = fastify.env.AI_MODEL;


                    const completion = await generateAICompletion(messageParams, openaiInstance, AIModel);
                    const answer = buildAnswer(completion);
                    const commentPayload = buildCommentPayload(answer, request.body.object_kind);
                    // POST COMMENT ON MERGE REQUEST
                    const aiComment = postAIComment({
                        gitLabBaseUrl,
                        mergeRequestIid,
                        headers: fastify.gitLabFetchHeaders,
                    }, commentPayload);
                    if (aiComment instanceof Error) throw aiComment;
                    fastify.log.info("AI Comment posted successfully");
                } catch (error) {
                    if (error instanceof Error) {
                        fastify.log.error(error.message, error);
                        return;
                    }
                }
            }
        )
}

export default gitlabWebhook;