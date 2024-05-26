import { WebhookPushEventSchema } from "@gitbeaker/rest";
import { buildPrompt, buildAnswer } from "../prompt.js";
import { GitLabWebhookHandler } from "../types.js";
import { fetchCommitDiff, fetchPreEditFiles, generateAICompletion } from "../utils.js";


export const handlePushHook: GitLabWebhookHandler<WebhookPushEventSchema> = async (pushEvent: WebhookPushEventSchema, {
    openaiInstance,
    AIModel,
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

    const messages = buildPrompt(oldFiles, changes);

    const completion = await generateAICompletion(messages, openaiInstance, AIModel);
    if (completion instanceof Error) return completion;


    const answer = buildAnswer(completion);

    return {
        commitSha,
        gitLabBaseUrl,
        commentPayload: { note: answer },
    }
}