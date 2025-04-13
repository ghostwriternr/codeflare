import {
    Message as APIMessage,
    ContentBlock,
    ContentBlockParam,
    ImageBlockParam,
    TextBlockParam,
    ToolResultBlockParam,
    ToolUseBlockParam,
} from '@anthropic-ai/sdk/resources/index.mjs';
import { last } from 'lodash-es';
import {
    AssistantMessage,
    Message,
    ProgressMessage,
    UserMessage,
} from '../query';
import { NO_CONTENT_MESSAGE } from '../services/claude';
import { Tool } from '../tool';

export const INTERRUPT_MESSAGE = '[Request interrupted by user]';
export const INTERRUPT_MESSAGE_FOR_TOOL_USE =
    '[Request interrupted by user for tool use]';
export const CANCEL_MESSAGE =
    "The user doesn't want to take this action right now. STOP what you are doing and wait for the user to tell you how to proceed.";

function baseCreateAssistantMessage(
    content: ContentBlock[],
    extra?: Partial<AssistantMessage>
): AssistantMessage {
    return {
        type: 'assistant',
        costUSD: 0,
        durationMs: 0,
        uuid: crypto.randomUUID(),
        message: {
            id: crypto.randomUUID(),
            model: '<synthetic>',
            role: 'assistant',
            stop_reason: 'stop_sequence',
            stop_sequence: '',
            type: 'message',
            usage: {
                input_tokens: 0,
                output_tokens: 0,
                cache_creation_input_tokens: 0,
                cache_read_input_tokens: 0,
            },
            content,
        },
        ...extra,
    };
}

export function createAssistantMessage(content: string): AssistantMessage {
    return baseCreateAssistantMessage([
        {
            type: 'text' as const,
            text: content === '' ? NO_CONTENT_MESSAGE : content,
            citations: [],
        },
    ]);
}

export function createUserMessage(
    content: string | ContentBlockParam[],
    toolUseResult?: FullToolUseResult
): UserMessage {
    const m: UserMessage = {
        type: 'user',
        message: {
            role: 'user',
            content,
        },
        uuid: crypto.randomUUID(),
        toolUseResult,
    };
    return m;
}

export function createProgressMessage(
    toolUseID: string,
    siblingToolUseIDs: Set<string>,
    content: AssistantMessage,
    normalizedMessages: NormalizedMessage[],
    tools: Tool[]
): ProgressMessage {
    return {
        type: 'progress',
        content,
        normalizedMessages,
        siblingToolUseIDs,
        tools,
        toolUseID,
        uuid: crypto.randomUUID(),
    };
}

export function createToolResultStopMessage(
    toolUseID: string
): ToolResultBlockParam {
    return {
        type: 'tool_result',
        content: CANCEL_MESSAGE,
        is_error: true,
        tool_use_id: toolUseID,
    };
}

export type FullToolUseResult = {
    data: unknown; // Matches tool's `Output` type
    resultForAssistant: ToolResultBlockParam['content'];
};

export function createAssistantAPIErrorMessage(
    content: string
): AssistantMessage {
    return baseCreateAssistantMessage(
        [
            {
                type: 'text' as const,
                text: content === '' ? NO_CONTENT_MESSAGE : content,
                citations: [],
            },
        ],
        { isApiErrorMessage: true }
    );
}

type NormalizedUserMessage = {
    message: {
        content: [
            | TextBlockParam
            | ImageBlockParam
            | ToolUseBlockParam
            | ToolResultBlockParam,
        ];
        role: 'user';
    };
    type: 'user';
    uuid: string;
};

export type NormalizedMessage =
    | NormalizedUserMessage
    | AssistantMessage
    | ProgressMessage;

// Sometimes the API returns empty messages (eg. "\n\n"). We need to filter these out,
// otherwise they will give an API error when we send them to the API next time we call query().
export function normalizeContentFromAPI(
    content: APIMessage['content']
): APIMessage['content'] {
    const filteredContent = content.filter(
        (_) => _.type !== 'text' || _.text.trim().length > 0
    );

    if (filteredContent.length === 0) {
        return [{ type: 'text', text: NO_CONTENT_MESSAGE, citations: [] }];
    }

    return filteredContent;
}

export function normalizeMessagesForAPI(
    messages: Message[]
): (UserMessage | AssistantMessage)[] {
    const result: (UserMessage | AssistantMessage)[] = [];
    messages
        .filter((_) => _.type !== 'progress')
        .forEach((message) => {
            switch (message.type) {
                case 'user': {
                    // If the current message is not a tool result, add it to the result
                    if (
                        !Array.isArray(message.message.content) ||
                        message.message.content[0]?.type !== 'tool_result'
                    ) {
                        result.push(message);
                        return;
                    }

                    // If the last message is not a tool result, add it to the result
                    const lastMessage = last(result);
                    if (
                        !lastMessage ||
                        lastMessage?.type === 'assistant' ||
                        !Array.isArray(lastMessage.message.content) ||
                        lastMessage.message.content[0]?.type !== 'tool_result'
                    ) {
                        result.push(message);
                        return;
                    }

                    // Otherwise, merge the current message with the last message
                    result[result.indexOf(lastMessage)] = {
                        ...lastMessage,
                        message: {
                            ...lastMessage.message,
                            content: [
                                ...lastMessage.message.content,
                                ...message.message.content,
                            ],
                        },
                    };
                    return;
                }
                case 'assistant':
                    result.push(message);
                    return;
            }
        });
    return result;
}
