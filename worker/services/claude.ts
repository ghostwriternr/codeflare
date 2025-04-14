import { AnthropicProvider, createAnthropic } from '@ai-sdk/anthropic';
import {
    CoreAssistantMessage,
    CoreSystemMessage,
    CoreToolMessage,
    CoreUserMessage,
    streamText,
    ToolSet,
} from 'ai';
import { getGlobalConfig } from '../utils/config';
import { normalizeContentFromAPI } from '../utils/messages';

export const API_ERROR_MESSAGE_PREFIX = 'API Error';
export const PROMPT_TOO_LONG_ERROR_MESSAGE = 'Prompt is too long';
export const CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE = 'Credit balance is too low';
export const INVALID_API_KEY_ERROR_MESSAGE =
    'Invalid API key · Please run /login';
export const MAIN_QUERY_TEMPERATURE = 1; // to get more variation for binary feedback

let anthropicClient: AnthropicProvider | null = null;
export function getAnthropicClient(): AnthropicProvider {
    if (anthropicClient) {
        return anthropicClient;
    }

    // TODO(@ghostwriternr): Remove this hard-coded key
    const apiKey =
        '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';
    anthropicClient = createAnthropic({ apiKey });
    return anthropicClient;
}

function splitSysPromptPrefix(systemPrompt: string[]): string[] {
    const systemPromptFirstBlock = systemPrompt[0] || '';
    const systemPromptRest = systemPrompt.slice(1);
    return [systemPromptFirstBlock, systemPromptRest.join('\n')].filter(
        Boolean
    );
}

export function querySonnet(
    messages: (CoreUserMessage | CoreAssistantMessage | CoreToolMessage)[],
    systemPrompt: string[],
    maxThinkingTokens: number,
    tools: ToolSet
) {
    return queryLLM('large', messages, systemPrompt, maxThinkingTokens, tools);
}

function getAssistantMessageFromError(error: unknown): AssistantMessage {
    if (
        error instanceof Error &&
        error.message.includes('prompt is too long')
    ) {
        return createAssistantAPIErrorMessage(PROMPT_TOO_LONG_ERROR_MESSAGE);
    }
    if (
        error instanceof Error &&
        error.message.includes('Your credit balance is too low')
    ) {
        return createAssistantAPIErrorMessage(
            CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE
        );
    }
    if (
        error instanceof Error &&
        error.message.toLowerCase().includes('x-api-key')
    ) {
        return createAssistantAPIErrorMessage(INVALID_API_KEY_ERROR_MESSAGE);
    }
    if (error instanceof Error) {
        return createAssistantAPIErrorMessage(
            `${API_ERROR_MESSAGE_PREFIX}: ${error.message}`
        );
    }
    return createAssistantAPIErrorMessage(API_ERROR_MESSAGE_PREFIX);
}

export function formatSystemPromptWithContext(
    systemPrompt: string[],
    context: { [k: string]: string }
): string[] {
    if (Object.entries(context).length === 0) {
        return systemPrompt;
    }

    return [
        ...systemPrompt,
        `\nAs you answer the user's questions, you can use the following context:\n`,
        ...Object.entries(context).map(
            ([key, value]) => `<context name="${key}">${value}</context>`
        ),
    ];
}

function queryLLM(
    modelType: 'large' | 'small',
    messages: (CoreUserMessage | CoreAssistantMessage | CoreToolMessage)[],
    systemPrompt: string[],
    maxThinkingTokens: number,
    tools: ToolSet
) {
    const config = getGlobalConfig();
    const model =
        modelType === 'large' ? config.largeModelName : config.smallModelName;
    const anthropic = getAnthropicClient();

    const systemMessages = splitSysPromptPrefix(
        systemPrompt
    ).map<CoreSystemMessage>((part) => ({
        role: 'system',
        content: part,
        providerOptions: {
            cacheControl: { type: 'ephemeral' },
        },
    }));

    return streamText({
        model: anthropic(model),
        maxTokens: getMaxTokensForModel(model),
        messages: [...systemMessages, ...messages],
        temperature: MAIN_QUERY_TEMPERATURE,
        tools,
        maxSteps: 10,
        ...(maxThinkingTokens > 0
            ? {
                  providerOptions: {
                      anthropic: {
                          thinking: {
                              type: 'enabled',
                              budgetTokens: maxThinkingTokens,
                          },
                      },
                  },
              }
            : {}),
    });
}

export function queryHaiku({
    systemPrompt = [],
    userPrompt,
}: {
    systemPrompt: string[];
    userPrompt: string;
}) {
    const messages = [{ role: 'user', content: userPrompt }] as (
        | CoreUserMessage
        | CoreAssistantMessage
    )[];
    return queryLLM('small', messages, systemPrompt, 0, {});
}

// TODO(@ghostwriternr): Generalise this beyond the Anthropic models
function getMaxTokensForModel(model: string): number {
    if (model.includes('3-5')) {
        return 8192;
    }
    if (model.includes('haiku')) {
        return 8192;
    }
    return 20_000;
}
