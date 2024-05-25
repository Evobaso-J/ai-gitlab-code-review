import { WebhookPushEventSchema } from "@gitbeaker/rest";
import { buildPrompt, buildAnswer } from "./prompt.js";
import { GitLabWebhookHandler } from "./types.js";
import { fetchCommitDiff, fetchPreEditFiles, generateAICompletion } from "./utils.js";


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
    const commitUrl = new URL(`repository/commits/${commitSha}/diff`, gitLabBaseUrl);

    const changes = await fetchCommitDiff(commitUrl, headers);
    if (changes instanceof Error) return changes;

    // transform the changes into a list of old file urls for a fetch request
    const oldFilesRequestUrls = changes.map(path =>
        new URL(`repository/files/${encodeURIComponent(path.old_path)}/raw`, gitLabBaseUrl)
    );

    // Fetch files before the edit
    const oldFiles = await fetchPreEditFiles(oldFilesRequestUrls, headers);
    if (oldFiles instanceof Error) return oldFiles;

    const messages = buildPrompt(oldFiles, changes);

    const completion = await generateAICompletion(messages, openaiInstance, AIModel);
    if (completion instanceof Error) return completion;


    const answer = buildAnswer(completion);

    return {
        commentUrl: new URL(`merge_requests/${commitSha}/notes`, gitLabBaseUrl),
        commentPayload: { note: answer },
    }
}