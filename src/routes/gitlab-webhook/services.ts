import OpenAI from "openai";
import type { CommitDiffSchema, RepositoryCompareSchema } from "@gitbeaker/rest";
import type { ChatCompletion, ChatModel } from "openai/resources/index.mjs";
import type { ChatCompletionMessageParam } from "openai/resources/index.js";
import { type GitLabFetchHeaders, OpenAIError, GitLabError, type CommentPayload } from "./types.js";
import { AI_MODEL_TEMPERATURE } from "../../config/prompt.js";

type GitLabFetchFunction<URLParams extends Record<string, any> = {}, Result = GitLabError> = (fetchParams: {
    gitLabBaseUrl: URL,
    headers: GitLabFetchHeaders,
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
    const commitUrl = new URL(`${gitLabBaseUrl}/repository/commits/${commitSha}/diff`);
    let changes: CommitDiffSchema[] | Error;

    try {
        changes = (await (
            await fetch(commitUrl, { headers })
        ).json()) as CommitDiffSchema[];
    } catch (error: any) {
        changes = error;
    }

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
    const compareUrl = new URL(`${gitLabBaseUrl}/repository/compare`);
    compareUrl.searchParams.append('from', targetBranch);
    compareUrl.searchParams.append('to', sourceBranch);
    compareUrl.searchParams.append('unidiff', String(true));

    let branchDiff: RepositoryCompareSchema | Error;
    try {
        branchDiff = (await (
            await fetch(compareUrl, { headers })
        ).json());
    } catch (error: any) {
        branchDiff = error;
    }
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
export type OldFileVersion = { fileName: string, fileContent: string };
type FetchPreEditFilesResult = OldFileVersion[] | GitLabError;
export const fetchPreEditFiles: GitLabFetchFunction<FetchPreEditFilesParams, FetchPreEditFilesResult> = async ({
    gitLabBaseUrl,
    headers,
    changesOldPaths,
}) => {
    const oldFilesRequestUrls = changesOldPaths.map(path =>
        new URL(`${gitLabBaseUrl}/repository/files/${encodeURIComponent(path)}/raw`)
    );
    // IF THE FILE HAS BEEN CREATED ANEW, THE OLD FILE WILL NOT EXIST
    let oldFiles: PromiseSettledResult<string>[] | Error;
    try {
        oldFiles = await Promise.allSettled(
            oldFilesRequestUrls.map(async (url) => {
                const file = await (
                    await fetch(url, { headers })
                ).text();
                return file;
            })
        );
    } catch (error: any) {
        oldFiles = error;
    }

    if (oldFiles instanceof Error) {
        return new GitLabError({
            name: "MISSING_OLD_FILES",
            message: "Failed to fetch old files",
        });
    }

    return oldFiles.reduce<OldFileVersion[]>((acc, file, index) => {
        if (file.status === "fulfilled") {
            acc.push({
                fileName: changesOldPaths[index]!,
                fileContent: file.value,
            });
        }
        return acc;
    }, []);
}

export async function generateAICompletion(messages: ChatCompletionMessageParam[], openaiInstance: OpenAI, aiModel: ChatModel): Promise<ChatCompletion | OpenAIError> {
    let completion: ChatCompletion | Error;

    try {
        completion = await openaiInstance.chat.completions.create(
            {
                model: aiModel,
                temperature: AI_MODEL_TEMPERATURE,
                stream: false,
                messages
            }
        )
    } catch (error: any) {
        completion = error;
    }

    if (completion instanceof Error) {
        return new OpenAIError({
            name: "MISSING_AI_COMPLETION",
            message: "Failed to generate AI completion",
        });
    }

    return completion;
}

type PostAICommentParams = {
    mergeRequestIid: string | number,
}
type PostAICommentResult = void | GitLabError;
export const postAIComment: GitLabFetchFunction<PostAICommentParams, PostAICommentResult> = async ({
    gitLabBaseUrl,
    headers,
    mergeRequestIid,
}, commentPayload: CommentPayload): Promise<void | GitLabError> => {
    const commentUrl = new URL(`${gitLabBaseUrl}/merge_requests/${mergeRequestIid}/notes`);
    let aiComment: Response | Error;
    try {
        aiComment = await fetch(commentUrl, {
            method: "POST",
            headers: {
                ...headers,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(commentPayload),
        });
    } catch (error: any) {
        aiComment = error;
    }
    if (aiComment instanceof Error) {
        return new GitLabError({
            name: "FAILED_TO_POST_COMMENT",
            message: "Failed to post AI comment",
        });
    }
}