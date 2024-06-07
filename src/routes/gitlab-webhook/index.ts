import type { FastifyPluginAsync, RequestParamsDefault, RequestQuerystringDefault } from "fastify";
import { GitLabError, type GitLabFetchHeaders, type GitLabWebhookHandlerReturnType, type SupportedWebhookEvent } from "./types.js";
import { handlePushHook, handleMergeRequestHook, } from "./hookHandlers.js";
import { postAIReview } from "./postAIReview.js";


export type GitLabWebhookRequest = {
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

const gitlabWebhook: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
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

            } catch (error: any) {
                fastify.gitLabWebhookHandlerResult = error
            }
            if (fastify.gitLabWebhookHandlerResult instanceof Error) {
                fastify.log.error(fastify.gitLabWebhookHandlerResult.message, fastify.gitLabWebhookHandlerResult);
                reply.code(500).send({ result: fastify.gitLabWebhookHandlerResult });
                return;
            }
            // We return a 200 OK to GitLab to avoid 
            // the webhook to timeout due to the AI completion
            // taking too long
            reply.code(200).send({ status: "OK" });
        })
    // CREATE AI COMMENT AND POST IT ON MERGE REQUEST
    postAIReview(fastify, opts)
}

export default gitlabWebhook;