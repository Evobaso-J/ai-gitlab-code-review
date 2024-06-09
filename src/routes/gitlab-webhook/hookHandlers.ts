import { buildPrompt } from "../../prompt/index.js";
import type { CommentPayload, GitLabWebhookHandler, SupportedWebhookEvent } from "./types.js";
import { fetchBranchDiff, fetchPreEditFiles, fetchCommitDiff } from "./services.js";
import type { WebhookMergeRequestEventSchema, WebhookPushEventSchema } from "@gitbeaker/rest";

const supportedMergeRequestActions: WebhookMergeRequestEventSchema['object_attributes']['action'][] = ["open", "reopen", "update"] as const;

export const handleMergeRequestHook: GitLabWebhookHandler<WebhookMergeRequestEventSchema> = async (mergeRequestEvent: WebhookMergeRequestEventSchema, {
    gitlabUrl,
    headers,
}) => {
    const {
        object_attributes: {
            target_project_id: targetProjectId,
            source_branch: sourceBranch,
            target_branch: targetBranch,
            iid: mergeRequestIid,
            action,
        },
    } = mergeRequestEvent;

    if (!supportedMergeRequestActions.includes(action)) return

    const gitLabBaseUrl = new URL(`${gitlabUrl}/projects/${targetProjectId}`);


    const changes = await fetchBranchDiff({
        gitLabBaseUrl,
        sourceBranch,
        targetBranch,
        headers
    });
    if (changes instanceof Error) return changes;

    const changesOldPaths = changes.diffs?.map(diff => diff.old_path) ?? []

    // Fetch files before the edit
    const oldFiles = await fetchPreEditFiles({
        gitLabBaseUrl,
        changesOldPaths,
        headers,
    });
    if (oldFiles instanceof Error) return oldFiles;

    const messageParams = buildPrompt(oldFiles, changes.diffs ?? []);

    return {
        mergeRequestIid,
        gitLabBaseUrl,
        messageParams,
    }
}


export const handlePushHook: GitLabWebhookHandler<WebhookPushEventSchema> = async (pushEvent: WebhookPushEventSchema, {
    gitlabUrl,
    headers,
}) => {
    const {
        project_id: projectId,
        after: commitSha,
    } = pushEvent;

    const gitLabBaseUrl = new URL(`${gitlabUrl}/projects/${projectId}`);

    // Get the commit diff

    const changes = await fetchCommitDiff({
        gitLabBaseUrl,
        commitSha,
        headers
    });
    if (changes instanceof Error) return changes;

    // Fetch files before the edit
    const oldFiles = await fetchPreEditFiles({
        gitLabBaseUrl,
        changesOldPaths: changes.map(change => change.old_path),
        headers
    });
    if (oldFiles instanceof Error) return oldFiles;

    const messageParams = buildPrompt(oldFiles, changes);

    return {
        mergeRequestIid: commitSha,
        gitLabBaseUrl,
        messageParams,
    }
}

export const buildCommentPayload = <T extends SupportedWebhookEvent>(answer: string, eventType: T['object_kind']): CommentPayload => {
    if (eventType === "merge_request") {
        return { body: answer } as CommentPayload
    }
    return { note: answer }

}