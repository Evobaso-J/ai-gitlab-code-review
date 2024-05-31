import OpenAI from "openai";
import type { CommitDiffSchema, RepositoryCompareSchema } from "@gitbeaker/rest";
import type { ChatCompletion, ChatModel } from "openai/resources/index.mjs";
import type { ChatCompletionMessageParam } from "openai/resources/index.js";
import { type FetchHeaders, type CommentPayload, OpenAIError, GitLabError } from "./types.js";

type GitLabFetchFunction<URLParams extends Record<string, any> = {}, Result = GitLabError> = (fetchParams: {
    gitLabBaseUrl: URL,
    headers: FetchHeaders,
} & URLParams, ...rest: any[]) => Promise<Result>

type FetchCommitParams = {
    commitSha: string,
}
type FetchCommitResult = CommitDiffSchema[] | GitLabError;
export const fetchCommitDiff: GitLabFetchFunction<FetchCommitParams, FetchCommitResult> = async ({
    gitLabBaseUrl,
    headers,
    commitSha,
}) => {
    const commitUrl = new URL(`repository/commits/${commitSha}/diff`, gitLabBaseUrl);

    const changes = (await (
        await fetch(commitUrl, { headers })
    ).json()) as CommitDiffSchema[];

    if (changes instanceof Error) {
        return new GitLabError({
            name: "MISSING_DIFF",
            message: "Failed to fetch commit diff",
        });
    }

    return changes;
}

type FetchBranchParams = {
    gitLabBaseUrl: URL,
    targetBranch: string,
    sourceBranch: string,
}
type FetchBranchResult = RepositoryCompareSchema | GitLabError;
export const fetchBranchDiff: GitLabFetchFunction<FetchBranchParams, FetchBranchResult> = async ({
    gitLabBaseUrl,
    headers,
    targetBranch,
    sourceBranch
}) => {
    const compareUrl = new URL(`repository/compare`, gitLabBaseUrl);
    compareUrl.searchParams.append('from', targetBranch);
    compareUrl.searchParams.append('to', sourceBranch);

    const branchDiff = (await (
        await fetch(compareUrl, { headers })
    ).json()) as RepositoryCompareSchema;

    if (branchDiff instanceof Error) {
        return new GitLabError({
            name: "MISSING_DIFF",
            message: "Failed to fetch branch diff",
        });
    }

    return branchDiff;
}

type FetchPreEditFilesParams = {
    changesOldPaths: string[],
}
type FetchPreEditFilesResult = string[] | GitLabError;
export const fetchPreEditFiles: GitLabFetchFunction<FetchPreEditFilesParams, FetchPreEditFilesResult> = async ({
    gitLabBaseUrl,
    headers,
    changesOldPaths,
}) => {
    const oldFilesRequestUrls = changesOldPaths.map(path =>
        new URL(`repository/files/${encodeURIComponent(path)}/raw`, gitLabBaseUrl)
    );

    const oldFiles = await Promise.all(
        oldFilesRequestUrls.map(async (url) => {
            const file = await (
                await fetch(url, { headers })
            ).text();

            return file;
        })
    );

    if (oldFiles instanceof Error) {
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

    if (completion instanceof Error) {
        return new OpenAIError({
            name: "MISSING_AI_COMPLETION",
            message: "Failed to generate AI completion",
        });
    }

    return completion;
}

type PostAICommentParams = {
    mergeRequestIid: string,
}
type PostAICommentResult = void | GitLabError;
export const postAIComment: GitLabFetchFunction<PostAICommentParams, PostAICommentResult> = async ({
    gitLabBaseUrl,
    headers,
    mergeRequestIid,
}, commentPayload: CommentPayload): Promise<void | GitLabError> => {
    const commentUrl = new URL(`merge_requests/${mergeRequestIid}/notes`, gitLabBaseUrl);

    const aiComment = fetch(commentUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(commentPayload),
    });

    if (aiComment instanceof Error) {
        return new GitLabError({
            name: "FAILED_TO_POST_COMMENT",
            message: "Failed to post AI comment",
        });
    }
}