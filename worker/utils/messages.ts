import {
    Message as APIMessage,
    ContentBlock,
    ImageBlockParam,
    TextBlockParam,
    ToolResultBlockParam,
    ToolUseBlockParam,
} from '@anthropic-ai/sdk/resources/index.mjs';
import { AssistantMessage, ProgressMessage } from '../query';
import { NO_CONTENT_MESSAGE } from '../services/claude';

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
