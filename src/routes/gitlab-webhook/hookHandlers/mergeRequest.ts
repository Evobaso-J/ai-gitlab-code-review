import type { WebhookMergeRequestEventSchema } from "@gitbeaker/rest";
import { buildPrompt, buildAnswer } from "../prompt.js";
import type { GitLabWebhookHandler } from "../types.js";
import { fetchBranchDiff, fetchPreEditFiles, generateAICompletion } from "../utils.js";


export const handleMergeRequestHook: GitLabWebhookHandler<WebhookMergeRequestEventSchema> = async (mergeRequestEvent: WebhookMergeRequestEventSchema, {
    openaiInstance,
    AIModel,
    gitlabUrl,
    headers,
}) => {
    const {
        object_attributes: {
            target_project_id: targetProjectId,
            source_branch: sourceBranch,
            target_branch: targetBranch,
            last_commit: { id: mergeRequestIid },
        },
    } = mergeRequestEvent;

    const gitLabBaseUrl = new URL(`${gitlabUrl}/projects/${targetProjectId}`);


    const changes = await fetchBranchDiff({
        gitLabBaseUrl,
        sourceBranch,
        targetBranch,
        headers
    }
    );
    if (changes instanceof Error) return changes;

    const changesOldPaths = changes.diffs?.map(diff => diff.old_path) ?? []

    // Fetch files before the edit
    const oldFiles = await fetchPreEditFiles({
        gitLabBaseUrl,
        changesOldPaths,
        headers,
    });
    if (oldFiles instanceof Error) return oldFiles;

    const messages = buildPrompt(oldFiles, changes.diffs ?? []);

    const completion = await generateAICompletion(messages, openaiInstance, AIModel);
    if (completion instanceof Error) return completion;


    const answer = buildAnswer(completion);

    return {
        mergeRequestIid,
        gitLabBaseUrl,
        commentPayload: { body: answer },
    }
}