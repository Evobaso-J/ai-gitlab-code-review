import { CommitDiffSchema } from "@gitbeaker/rest";
import { ChatCompletion, ChatModel } from "openai/resources/index.mjs";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/src/resources/index.js";
import { FetchHeaders, CommentPayload, GitLabError, OpenAIError } from "./types.js";


export async function fetchCommitDiff(commitUrl: URL, headers: FetchHeaders): Promise<CommitDiffSchema[] | GitLabError> {
    const changes = (await (
        await fetch(commitUrl, { headers })
    ).json()) as CommitDiffSchema[];

    if (!changes?.length) {
        return new GitLabError({
            name: "MISSING_DIFF",
            message: "Failed to fetch commit diff",
        });
    }

    return changes;
}

export async function fetchPreEditFiles(oldFilesRequestUrls: URL[], headers: FetchHeaders): Promise<string[] | GitLabError> {
    const oldFiles = await Promise.all(
        oldFilesRequestUrls.map(async (url) => {
            const file = await (
                await fetch(url, { headers })
            ).text();

            return file;
        })
    );

    if (!oldFiles.length) {
        return new GitLabError({
            name: "MISSING_OLD_FILES",
            message: "Failed to fetch old files",
        });
    }

    return oldFiles;
}

export async function generateAICompletion(messages: ChatCompletionMessageParam[], openaiInstance: OpenAI, aiModel: ChatModel): Promise<ChatCompletion | OpenAIError> {
    const completion = await openaiInstance.chat.completions.create(
        {
            model: aiModel,
            temperature: 0.7,
            stream: false,
            messages
        }
    )

    if (!completion) {
        return new OpenAIError({
            name: "MISSING_AI_COMPLETION",
            message: "Failed to generate AI completion",
        });
    }

    return completion;
}

export async function postAIComment(commentUrl: URL, headers: FetchHeaders, commentPayload: CommentPayload): Promise<void | GitLabError> {
    const aiComment = fetch(commentUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(commentPayload),
    });

    if (!aiComment) {
        return new GitLabError({
            name: "FAILED_TO_POST_COMMENT",
            message: "Failed to post AI comment",
        });
    }
}