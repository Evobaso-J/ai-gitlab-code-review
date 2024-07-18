import type { WebhookPushEventSchema, WebhookMergeRequestEventSchema } from '@gitbeaker/rest'
import { BaseError } from '../../config/errors.js'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

export interface GitLabFetchHeaders {
  'private-token': string
}

export type CommentPayload = { body: string } | { note: string }

// #region Webhook Handler
export type SupportedWebhookEvent = WebhookPushEventSchema | WebhookMergeRequestEventSchema
export interface WebhookHandlerResult {
  mergeRequestIid: string | number
  messageParams: ChatCompletionMessageParam[]
  gitLabBaseUrl: URL
}

export type GitLabWebhookHandler<TWebhookEvent extends SupportedWebhookEvent = SupportedWebhookEvent> = (event: TWebhookEvent, envVariables: {
  gitlabUrl: URL
  headers: GitLabFetchHeaders
}) => Promise<WebhookHandlerResult | Error | undefined>

export type GitLabWebhookHandlerReturnType = Awaited<ReturnType<GitLabWebhookHandler>>
// #endregion

// #region Errors
type GitLabErrorName =
    | 'MISSING_DIFF'
    | 'EMPTY_DIFF'
    | 'MISSING_OLD_FILES'
    | 'FAILED_TO_POST_COMMENT'
    | 'UNSUPPORTED_EVENT_TYPE'

type OpenAIErrorName =
    | 'MISSING_AI_COMPLETION'

export class GitLabError extends BaseError<GitLabErrorName> { }
export class OpenAIError extends BaseError<OpenAIErrorName> { }
// #endregion
