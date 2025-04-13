import {
    Message as APIAssistantMessage,
    MessageParam,
} from '@anthropic-ai/sdk/resources/index.mjs';
import { Tool } from './tool';
import { FullToolUseResult, NormalizedMessage } from './utils/messages';

export type UserMessage = {
    message: MessageParam;
    type: 'user';
    uuid: string;
    toolUseResult?: FullToolUseResult;
};

export type AssistantMessage = {
    costUSD: number;
    durationMs: number;
    message: APIAssistantMessage;
    type: 'assistant';
    uuid: string;
    isApiErrorMessage?: boolean;
};

export type ProgressMessage = {
    content: AssistantMessage;
    normalizedMessages: NormalizedMessage[];
    siblingToolUseIDs: Set<string>;
    tools: Tool[];
    toolUseID: string;
    type: 'progress';
    uuid: string;
};

// Each array item is either a single message or a message-and-response pair
export type Message = UserMessage | AssistantMessage | ProgressMessage;
