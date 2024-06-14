import { type FastifyPluginAsync } from "fastify";
import OpenAI from "openai";
import { buildAnswer } from "../../prompt/index.js";
import { buildCommentPayload } from "./hookHandlers.js";
import { generateAICompletion, postAIComment, uploadImageToGitlab } from "./services.js";
import type { GitLabWebhookRequest } from "./index.js";

export const postAIReview: FastifyPluginAsync =
    async (fastify): Promise<void> => {

        fastify.addHook<GitLabWebhookRequest>('onResponse',
            async (request, _reply) => {
                if (request.headers['x-gitlab-token'] !== fastify.env.GITLAB_TOKEN) {
                    fastify.log.error({ error: 'Unauthorized' });
                    return;
                }
                if (!request.body) {
                    fastify.log.error({ error: 'Bad Request' });
                    return;
                }

                if (fastify.gitLabWebhookHandlerResult instanceof Error) throw fastify.gitLabWebhookHandlerResult;

                if (!fastify.gitLabWebhookHandlerResult) return;

                // CREATE AI COMMENT
                const { messageParams, gitLabBaseUrl, mergeRequestIid } = fastify.gitLabWebhookHandlerResult;

                // Check if error.png and intro.png are in the assets folder
                const introImage = await uploadImageToGitlab('assets/intro.png', gitLabBaseUrl, fastify.gitLabFetchHeaders)
                const errorImage = await uploadImageToGitlab('assets/error.png', gitLabBaseUrl, fastify.gitLabFetchHeaders)

                try {
                    const openaiInstance = new OpenAI({
                        apiKey: fastify.env.OPENAI_API_KEY,
                    });
                    const AIModel = fastify.env.AI_MODEL;


                    const completion = await generateAICompletion(messageParams, openaiInstance, AIModel);
                    const answer = buildAnswer(completion, {
                        introImage: (introImage instanceof Error) ? undefined : introImage,
                        errorImage: (errorImage instanceof Error) ? undefined : errorImage
                    });
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
            })
    }
