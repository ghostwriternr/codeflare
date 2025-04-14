import Anthropic from '@anthropic-ai/sdk';
import { APIConnectionError, APIError } from '@anthropic-ai/sdk/error.mjs';
import { BetaMessageStream } from '@anthropic-ai/sdk/lib/BetaMessageStream.mjs';
import {
    Message as APIMessage,
    MessageParam,
    TextBlockParam,
} from '@anthropic-ai/sdk/resources/index.mjs';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AssistantMessage, UserMessage } from '../query';
import { Tool } from '../tool';
import {
    createAssistantAPIErrorMessage,
    normalizeContentFromAPI,
} from '../utils/messages';

interface StreamResponse extends APIMessage {
    ttftMs?: number;
}

export const API_ERROR_MESSAGE_PREFIX = 'API Error';
export const PROMPT_TOO_LONG_ERROR_MESSAGE = 'Prompt is too long';
export const CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE = 'Credit balance is too low';
export const INVALID_API_KEY_ERROR_MESSAGE =
    'Invalid API key · Please run /login';
export const NO_CONTENT_MESSAGE = '(no content)';
export const MAIN_QUERY_TEMPERATURE = 1; // to get more variation for binary feedback

// TODO(@ghostwriternr): Come back to this if needed
function getMetadata() {
    // return {
    //     user_id: `${getOrCreateUserID()}_${SESSION_ID}`,
    // };
    return {};
}

const MAX_RETRIES = 10;
const BASE_DELAY_MS = 500;
interface RetryOptions {
    maxRetries?: number;
}

function shouldRetry(error: APIError): boolean {
    // Check for overloaded errors first and only retry for SWE_BENCH
    if (error.message?.includes('"type":"overloaded_error"')) {
        return false;
    }

    // Note this is not a standard header.
    const shouldRetryHeader = error.headers?.['x-should-retry'];

    // If the server explicitly says whether or not to retry, obey.
    if (shouldRetryHeader === 'true') return true;
    if (shouldRetryHeader === 'false') return false;

    if (error instanceof APIConnectionError) {
        return true;
    }

    if (!error.status) return false;

    // Retry on request timeouts.
    if (error.status === 408) return true;

    // Retry on lock timeouts.
    if (error.status === 409) return true;

    // Retry on rate limits.
    if (error.status === 429) return true;

    // Retry internal errors.
    if (error.status && error.status >= 500) return true;

    return false;
}

function getRetryDelay(
    attempt: number,
    retryAfterHeader?: string | null
): number {
    if (retryAfterHeader) {
        const seconds = parseInt(retryAfterHeader, 10);
        if (!isNaN(seconds)) {
            return seconds * 1000;
        }
    }
    return Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), 32000); // Max 32s delay
}

async function withRetry<T>(
    operation: (attempt: number) => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const maxRetries = options.maxRetries ?? MAX_RETRIES;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await operation(attempt);
        } catch (error) {
            lastError = error;

            // Only retry if the error indicates we should
            if (
                attempt > maxRetries ||
                !(error instanceof APIError) ||
                !shouldRetry(error)
            ) {
                throw error;
            }
            // Get retry-after header if available
            const retryAfter = error.headers?.['retry-after'] ?? null;
            const delayMs = getRetryDelay(attempt, retryAfter);

            console.log(
                `API ${error.name} (${error.message}) · Retrying in ${Math.round(delayMs / 1000)} seconds… (attempt ${attempt}/${maxRetries})`
            );

            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    throw lastError;
}

async function handleMessageStream(
    stream: BetaMessageStream
): Promise<StreamResponse> {
    const streamStartTime = Date.now();
    let ttftMs: number | undefined;

    // TODO(ben): Consider showing an incremental progress indicator.
    for await (const part of stream) {
        if (part.type === 'message_start') {
            ttftMs = Date.now() - streamStartTime;
        }
    }

    const finalResponse = await stream.finalMessage();
    return {
        ...finalResponse,
        ttftMs,
    };
}

let anthropicClient: Anthropic | null = null;
export function getAnthropicClient(): Anthropic {
    if (anthropicClient) {
        return anthropicClient;
    }

    const defaultHeaders: { [key: string]: string } = {
        'x-app': 'cli',
        'User-Agent': 'cloud-code', // TODO(@ghostwriternr): Review this later
    };
    // TODO(@ghostwriternr): Remove this
    const apiKey =
        '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';
    defaultHeaders['Authorization'] = `Bearer ${apiKey}`;

    const ARGS = {
        defaultHeaders,
        maxRetries: 0, // Disabled auto-retry in favor of manual implementation
        timeout: parseInt(String(60 * 1000), 10),
    };

    anthropicClient = new Anthropic({
        apiKey,
        // dangerouslyAllowBrowser: true,
        ...ARGS,
    });
    return anthropicClient;
}

export function userMessageToMessageParam(
    message: UserMessage,
    addCache = false
): MessageParam {
    if (addCache) {
        if (typeof message.message.content === 'string') {
            return {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: message.message.content,
                        cache_control: { type: 'ephemeral' },
                    },
                ],
            };
        } else {
            return {
                role: 'user',
                content: message.message.content.map((_, i) => ({
                    ..._,
                    ...(i === message.message.content.length - 1
                        ? { cache_control: { type: 'ephemeral' } }
                        : {}),
                })),
            };
        }
    }
    return {
        role: 'user',
        content: message.message.content,
    };
}

export function assistantMessageToMessageParam(
    message: AssistantMessage,
    addCache = false
): MessageParam {
    if (addCache) {
        if (typeof message.message.content === 'string') {
            return {
                role: 'assistant',
                content: [
                    {
                        type: 'text',
                        text: message.message.content,
                        cache_control: { type: 'ephemeral' },
                    },
                ],
            };
        } else {
            return {
                role: 'assistant',
                content: message.message.content.map((_, i) => ({
                    ..._,
                    ...(i === message.message.content.length - 1 &&
                    _.type !== 'thinking' &&
                    _.type !== 'redacted_thinking'
                        ? { cache_control: { type: 'ephemeral' } }
                        : {}),
                })),
            };
        }
    }
    return {
        role: 'assistant',
        content: message.message.content,
    };
}

function splitSysPromptPrefix(systemPrompt: string[]): string[] {
    const systemPromptFirstBlock = systemPrompt[0] || '';
    const systemPromptRest = systemPrompt.slice(1);
    return [systemPromptFirstBlock, systemPromptRest.join('\n')].filter(
        Boolean
    );
}

export async function querySonnet(
    messages: (UserMessage | AssistantMessage)[],
    systemPrompt: string[],
    maxThinkingTokens: number,
    tools: Tool[],
    signal: AbortSignal,
    options: {
        dangerouslySkipPermissions: boolean;
        model: string;
    }
): Promise<AssistantMessage> {
    return queryLLM(
        'large',
        messages,
        systemPrompt,
        maxThinkingTokens,
        tools,
        signal,
        options
    );
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

function addCacheBreakpoints(
    messages: (UserMessage | AssistantMessage)[]
): MessageParam[] {
    return messages.map((msg, index) => {
        return msg.type === 'user'
            ? userMessageToMessageParam(msg, index > messages.length - 3)
            : assistantMessageToMessageParam(msg, index > messages.length - 3);
    });
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

async function queryLLM(
    modelType: 'large' | 'small',
    messages: (UserMessage | AssistantMessage)[],
    systemPrompt: string[],
    maxThinkingTokens: number,
    tools: Tool[],
    signal: AbortSignal,
    options: {
        dangerouslySkipPermissions: boolean;
        model: string;
    }
): Promise<AssistantMessage> {
    const anthropic = getAnthropicClient();

    const system: TextBlockParam[] = splitSysPromptPrefix(systemPrompt).map(
        (_) => ({
            cache_control: { type: 'ephemeral' },
            text: _,
            type: 'text',
        })
    );

    const toolSchemas = await Promise.all(
        tools.map(async (tool) => ({
            name: tool.name,
            description: await tool.prompt({
                dangerouslySkipPermissions:
                    options?.dangerouslySkipPermissions ?? false,
            }),
            input_schema: ('inputJSONSchema' in tool && tool.inputJSONSchema
                ? tool.inputJSONSchema
                : zodToJsonSchema(
                      tool.inputSchema
                  )) as Anthropic.Tool.InputSchema,
        }))
    );

    let start = Date.now();
    let attemptNumber = 0;
    let response;
    let stream: BetaMessageStream | undefined = undefined;
    try {
        response = await withRetry(async (attempt) => {
            attemptNumber = attempt;
            start = Date.now();
            const s = anthropic.beta.messages.stream(
                {
                    model: options.model,
                    max_tokens: Math.max(
                        maxThinkingTokens + 1,
                        getMaxTokensForModel(options.model)
                    ),
                    messages: addCacheBreakpoints(messages),
                    temperature: MAIN_QUERY_TEMPERATURE,
                    system,
                    tools: toolSchemas,
                    // ...(useBetas ? { betas } : {}),
                    metadata: getMetadata(),
                    ...(maxThinkingTokens > 0
                        ? {
                              thinking: {
                                  budget_tokens: maxThinkingTokens,
                                  type: 'enabled',
                              },
                          }
                        : {}),
                },
                { signal }
            );
            stream = s;
            return handleMessageStream(s);
        });
    } catch (error) {
        console.log(error);
        return getAssistantMessageFromError(error);
    }

    return {
        message: {
            ...response,
            content: normalizeContentFromAPI(response.content),
            usage: {
                ...response.usage,
                cache_read_input_tokens:
                    response.usage.cache_read_input_tokens ?? 0,
                cache_creation_input_tokens:
                    response.usage.cache_creation_input_tokens ?? 0,
            },
        },
        costUSD: 0,
        durationMs: 0,
        type: 'assistant',
        uuid: crypto.randomUUID(),
    };
}

export async function queryHaiku({
    systemPrompt = [],
    userPrompt,
    assistantPrompt,
    enablePromptCaching = false,
    signal,
}: {
    systemPrompt: string[];
    userPrompt: string;
    assistantPrompt?: string;
    enablePromptCaching?: boolean;
    signal?: AbortSignal;
}): Promise<AssistantMessage> {
    const messages = [
        {
            message: { role: 'user', content: userPrompt },
            type: 'user',
            uuid: crypto.randomUUID(),
        },
    ] as (UserMessage | AssistantMessage)[];
    return queryLLM(
        'small',
        messages,
        systemPrompt,
        0,
        [],
        // TODO(@ghostwriternr): Sus.
        signal ?? new AbortController().signal,
        {
            dangerouslySkipPermissions: false,
            // TODO(@ghostwriternr): Seems repetitive but I'll allow it for now.
            model: 'claude-3-5-haiku-latest',
        }
    );
}

function getMaxTokensForModel(model: string): number {
    if (model.includes('3-5')) {
        return 8192;
    }
    if (model.includes('haiku')) {
        return 8192;
    }
    return 20_000;
}
