import type { WebhookPushEventSchema, WebhookMergeRequestEventSchema } from "@gitbeaker/rest";
import type { ChatModel } from "openai/resources/index.mjs";
import OpenAI from "openai";
import { BaseError } from "../../config/errors.js";

export type FetchHeaders = {
    'private-token': string;
}
export type CommentPayload = { "body": string } | { note: string } | undefined;



// #region Webhook Handler
export type SupportedWebhookEvent = WebhookPushEventSchema | WebhookMergeRequestEventSchema;
export type WebhookHandlerResult<T extends SupportedWebhookEvent> = {
    mergeRequestIid: string;
    commentPayload: ExtractPayloadTypeFromEvent<T>;
    gitLabBaseUrl: URL;
}

type ExtractPayloadTypeFromEvent<T extends SupportedWebhookEvent> =
    T extends WebhookPushEventSchema ? { note: string }
    : T extends WebhookMergeRequestEventSchema ? { body: string }
    : never;

export type GitLabWebhookHandler<TWebhookEvent extends SupportedWebhookEvent = SupportedWebhookEvent> = (event: TWebhookEvent, envVariables: {
    openaiInstance: OpenAI,
    AIModel: ChatModel,
    gitlabUrl: URL,
    headers: FetchHeaders
}) => Promise<WebhookHandlerResult<TWebhookEvent> | Error>;
// #endregion



// #region Errors
type GitLabErrorName =
    | "MISSING_DIFF"
    | "MISSING_OLD_FILES"
    | "FAILED_TO_POST_COMMENT"
    | "UNSUPPORTED_EVENT_TYPE"

type OpenAIErrorName =
    | "MISSING_AI_COMPLETION"


export class GitLabError extends BaseError<GitLabErrorName> { }
export class OpenAIError extends BaseError<OpenAIErrorName> { }
// #endregion