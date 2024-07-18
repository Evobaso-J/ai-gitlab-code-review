import { buildPrompt } from '../../prompt/index.js'
import { GitLabError, type CommentPayload, type GitLabWebhookHandler, type SupportedWebhookEvent } from './types.js'
import { fetchBranchDiff, fetchPreEditFiles } from './services.js'
import type { WebhookMergeRequestEventSchema } from '@gitbeaker/rest'

const supportedMergeRequestActions: Array<WebhookMergeRequestEventSchema['object_attributes']['action']> = [
  'update'
] as const

export const handleMergeRequestHook: GitLabWebhookHandler<WebhookMergeRequestEventSchema> = async (mergeRequestEvent: WebhookMergeRequestEventSchema, {
  gitlabUrl,
  headers
}) => {
  const {
    object_attributes: {
      target_project_id: targetProjectId,
      source_branch: sourceBranch,
      target_branch: targetBranch,
      iid: mergeRequestIid,
      action
    }
  } = mergeRequestEvent

  if (!supportedMergeRequestActions.includes(action)) return

  const gitLabBaseUrl = new URL(`${gitlabUrl}/projects/${targetProjectId}`)

  const changes = await fetchBranchDiff({
    gitLabBaseUrl,
    sourceBranch,
    targetBranch,
    headers
  })
  if (changes instanceof Error) return changes
  if ((changes.diffs == null) || (changes.diffs.length === 0)) return new GitLabError({ name: 'EMPTY_DIFF', message: 'No changes found in the merge request', statusCode: 404 })

  const changesOldPaths = changes.diffs.map(diff => diff.old_path)

  // Fetch files before the edit
  const oldFiles = await fetchPreEditFiles({
    gitLabBaseUrl,
    changesOldPaths,
    headers
  })
  if (oldFiles instanceof Error) return oldFiles

  const messageParams = buildPrompt({ oldFiles, changes: changes.diffs ?? [] })

  return {
    mergeRequestIid,
    gitLabBaseUrl,
    messageParams
  }
}

export const buildCommentPayload = <T extends SupportedWebhookEvent>(answer: string, eventType: T['object_kind']): CommentPayload => {
  if (eventType === 'merge_request') {
    return { body: answer } as CommentPayload
  }
  return { note: answer }
}
