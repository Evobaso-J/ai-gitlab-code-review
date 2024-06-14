import type { CommitDiffSchema } from "@gitbeaker/rest";
import type { ChatCompletionMessageParam, ChatCompletion } from "openai/resources/index.mjs";
import type { OldFileVersion } from "../routes/gitlab-webhook/services.js";


const QUESTIONS = `\n\nQuestions:\n
1. Can you summarize the changes in a succinct bullet point list\n
2. In the diff, are the added or changed code written in a clear and easy to understand way?\n
3. Does the code use comments, or descriptive function and variables names that explain what they mean?\n
4. based on the code complexity of the changes, could the code be simplified without breaking its functionality? if so can you give example snippets?\n
5. Can you find any bugs, if so please explain and reference line numbers?\n
6. Do you see any code that could induce security issues?\n\n`

const MESSAGES: ChatCompletionMessageParam[] = [{
    role: 'system',
    content: "You are a senior developer reviewing code changes."
},
{
    role: 'assistant',
    content: "Format the response so it renders nicely in GitLab, with nice and organized markdown (use code blocks if needed), and send just the response no comments on the request, when answering include a short version of the question, so we know what it is."
}]

export const AI_MODEL_TEMPERATURE = 0.2

export type BuildPromptParameters = {
    oldFiles: OldFileVersion[],
    changes: Pick<CommitDiffSchema, 'diff'>[]

}
export const buildPrompt = ({ changes, oldFiles }: BuildPromptParameters): ChatCompletionMessageParam[] => {
    const content = `
    As a senior developer, review the following code changes and answer code review questions about them. The code changes are provided as git diff strings.
    The entire file before the change is provided for context. Make sure to keep it as a reference when reviewing the changes.

    Files before changes:
    ${oldFiles.map(oldFile => JSON.stringify(oldFile)).join('\n\n')}

    Changes:
    ${changes.map(change => change.diff).join('\n\n')}

    ${QUESTIONS}
    `

    return [...MESSAGES, { role: 'user', content }]

}

const INTRO_FLAVOR_TEXT =
    process.env.INTRO_FLAVOR_TEXT ||
    `Hi there! I'm an AI charged to review your code changes. Here are my thoughts on your work:`

const ERROR_ANSWER =
    process.env.ERROR_ANSWER ||
    `An internal error occurred. Please ask a human to review this code change.`

const COMMENT_DISCLAIMER =
    process.env.COMMENT_DISCLAIMER ||
    `This is an AI-generated response. Please review the code changes yourself before merging.`


type AnswerImagesPaths = {
    introImage?: string,
    errorImage?: string
}
export const buildAnswer = (completion: ChatCompletion | Error | undefined, answerImages?: AnswerImagesPaths): string => {
    if (completion instanceof Error) {
        return `
        ![](${answerImages?.errorImage ?? ''})\n\n
        ${ERROR_ANSWER}\n\n
        Error: ${completion.message}\n\n
        ${COMMENT_DISCLAIMER}`;
    }
    if (!completion || !completion.choices.length) {
        return `
        ![](${answerImages?.errorImage ?? ''})\n\n
        ${ERROR_ANSWER}\n\n
        ${COMMENT_DISCLAIMER}`;
    }
    return `
    ${INTRO_FLAVOR_TEXT}\n\n
    ![](${answerImages?.introImage ?? ''})\n\n
    ${completion.choices[0]!.message.content}\n\n${COMMENT_DISCLAIMER}`;
}