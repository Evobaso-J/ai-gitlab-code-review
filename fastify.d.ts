import { ChatModel } from "openai/resources/index.mjs";

declare module 'fastify' {
    interface FastifyInstance {
        env: {
            OPENAI_API_KEY: string
            GITLAB_TOKEN: string
            GITLAB_URL: string
            EXPECTED_GITLAB_TOKEN: string
            AI_MODEL: ChatModel

            // Customization options
            INTRO_FLAVOR_TEXT: string | undefined
            ERROR_ANSWER: string | undefined
            COMMENT_DISCLAIMER: string | undefined
        };
    }
}