import { type AnthropicProvider, createAnthropic } from '@ai-sdk/anthropic';
import { getGlobalConfig } from '@repo/common/utils/config';
import {
    type CoreSystemMessage,
    type Message,
    streamText,
    type StreamTextOnFinishCallback,
    type ToolSet,
} from 'ai';

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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not set');
    }
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
    messages: Message[],
    systemPrompt: string[],
    maxThinkingTokens: number,
    tools: ToolSet,
    onFinish: StreamTextOnFinishCallback<ToolSet>
) {
    return queryLLM(
        'large',
        messages,
        systemPrompt,
        maxThinkingTokens,
        tools,
        onFinish
    );
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
    messages: Message[],
    systemPrompt: string[],
    maxThinkingTokens: number,
    tools: ToolSet,
    onFinish: StreamTextOnFinishCallback<ToolSet>
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
        maxSteps: 40,
        onFinish,
        onStepFinish: () => {
            // console.log('Step finished.');
            // for (const message of step.response.messages) {
            //     console.log(message.content);
            // }
        },
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
    const messages = [{ role: 'user', content: userPrompt }] as Message[];
    return queryLLM('small', messages, systemPrompt, 0, {}, () => {});
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
