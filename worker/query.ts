import {
    Message as APIAssistantMessage,
    MessageParam,
    ToolUseBlock,
} from '@anthropic-ai/sdk/resources/index.mjs';
import { formatSystemPromptWithContext, querySonnet } from './services/claude';
import { Tool, ToolUseContext } from './tool';
import { all } from './utils/generators';
import {
    createAssistantMessage,
    createProgressMessage,
    createToolResultStopMessage,
    createUserMessage,
    FullToolUseResult,
    INTERRUPT_MESSAGE,
    INTERRUPT_MESSAGE_FOR_TOOL_USE,
    NormalizedMessage,
    normalizeMessagesForAPI,
} from './utils/messages';
import { CanUseToolFn } from './hooks/tools';

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

const MAX_TOOL_USE_CONCURRENCY = 10;

export async function* query(
    messages: Message[],
    systemPrompt: string[],
    context: { [k: string]: string },
    canUseTool: CanUseToolFn,
    toolUseContext: ToolUseContext
): AsyncGenerator<Message, void> {
    const fullSystemPrompt = formatSystemPromptWithContext(
        systemPrompt,
        context
    );
    function getAssistantResponse() {
        return querySonnet(
            normalizeMessagesForAPI(messages),
            fullSystemPrompt,
            toolUseContext.options.maxThinkingTokens,
            toolUseContext.options.tools,
            toolUseContext.abortController.signal,
            {
                dangerouslySkipPermissions:
                    toolUseContext.options.dangerouslySkipPermissions ?? false,
                model: toolUseContext.options.slowAndCapableModel,
            }
        );
    }

    if (toolUseContext.abortController.signal.aborted) {
        yield createAssistantMessage(INTERRUPT_MESSAGE);
        return;
    }

    const assistantMessage = await getAssistantResponse();
    const shouldSkipPermissionCheck = false;
    yield assistantMessage;

    // @see https://docs.anthropic.com/en/docs/build-with-claude/tool-use
    // Note: stop_reason === 'tool_use' is unreliable -- it's not always set correctly
    const toolUseMessages = assistantMessage.message.content.filter(
        (_) => _.type === 'tool_use'
    );

    // If there's no more tool use, we're done
    if (!toolUseMessages.length) {
        return;
    }

    const toolResults: UserMessage[] = [];

    // Prefer to run tools concurrently, if we can
    // TODO: tighten up the logic -- we can run concurrently much more often than this
    if (
        toolUseMessages.every((msg) =>
            toolUseContext.options.tools
                .find((t) => t.name === msg.name)
                ?.isReadOnly()
        )
    ) {
        for await (const message of runToolsConcurrently(
            toolUseMessages,
            assistantMessage,
            canUseTool,
            toolUseContext,
            shouldSkipPermissionCheck
        )) {
            yield message;
            // progress messages are not sent to the server, so don't need to be accumulated for the next turn
            if (message.type === 'user') {
                toolResults.push(message);
            }
        }
    } else {
        for await (const message of runToolsSerially(
            toolUseMessages,
            assistantMessage,
            canUseTool,
            toolUseContext,
            shouldSkipPermissionCheck
        )) {
            yield message;
            // progress messages are not sent to the server, so don't need to be accumulated for the next turn
            if (message.type === 'user') {
                toolResults.push(message);
            }
        }
    }

    if (toolUseContext.abortController.signal.aborted) {
        yield createAssistantMessage(INTERRUPT_MESSAGE_FOR_TOOL_USE);
        return;
    }

    // Sort toolResults to match the order of toolUseMessages
    const orderedToolResults = toolResults.sort((a, b) => {
        const aIndex = toolUseMessages.findIndex(
            (tu) => tu.id === (a.message.content[0] as ToolUseBlock).id
        );
        const bIndex = toolUseMessages.findIndex(
            (tu) => tu.id === (b.message.content[0] as ToolUseBlock).id
        );
        return aIndex - bIndex;
    });

    yield* await query(
        [...messages, assistantMessage, ...orderedToolResults],
        systemPrompt,
        context,
        canUseTool,
        toolUseContext
    );
}

async function* runToolsConcurrently(
    toolUseMessages: ToolUseBlock[],
    assistantMessage: AssistantMessage,
    canUseTool: CanUseToolFn,
    toolUseContext: ToolUseContext,
    shouldSkipPermissionCheck?: boolean
): AsyncGenerator<Message, void> {
    yield* all(
        toolUseMessages.map((toolUse) =>
            runToolUse(
                toolUse,
                new Set(toolUseMessages.map((_) => _.id)),
                assistantMessage,
                canUseTool,
                toolUseContext,
                shouldSkipPermissionCheck
            )
        ),
        MAX_TOOL_USE_CONCURRENCY
    );
}

async function* runToolsSerially(
    toolUseMessages: ToolUseBlock[],
    assistantMessage: AssistantMessage,
    canUseTool: CanUseToolFn,
    toolUseContext: ToolUseContext,
    shouldSkipPermissionCheck?: boolean
): AsyncGenerator<Message, void> {
    for (const toolUse of toolUseMessages) {
        yield* runToolUse(
            toolUse,
            new Set(toolUseMessages.map((_) => _.id)),
            assistantMessage,
            canUseTool,
            toolUseContext,
            shouldSkipPermissionCheck
        );
    }
}

export async function* runToolUse(
    toolUse: ToolUseBlock,
    siblingToolUseIDs: Set<string>,
    assistantMessage: AssistantMessage,
    canUseTool: CanUseToolFn,
    toolUseContext: ToolUseContext,
    shouldSkipPermissionCheck?: boolean
): AsyncGenerator<Message, void> {
    const toolName = toolUse.name;
    const tool = toolUseContext.options.tools.find((t) => t.name === toolName);

    // Check if the tool exists
    if (!tool) {
        yield createUserMessage([
            {
                type: 'tool_result',
                content: `Error: No such tool available: ${toolName}`,
                is_error: true,
                tool_use_id: toolUse.id,
            },
        ]);
        return;
    }

    const toolInput = toolUse.input as { [key: string]: string };

    try {
        if (toolUseContext.abortController.signal.aborted) {
            const message = createUserMessage([
                createToolResultStopMessage(toolUse.id),
            ]);
            yield message;
            return;
        }

        for await (const message of checkPermissionsAndCallTool(
            tool,
            toolUse.id,
            siblingToolUseIDs,
            toolInput,
            toolUseContext,
            canUseTool,
            assistantMessage,
            shouldSkipPermissionCheck
        )) {
            yield message;
        }
    } catch (e) {
        console.log(e);
    }
}

// TODO(@ghostwriternr): Implement this, looks necessary for bash tool
export function normalizeToolInput(
    tool: Tool,
    input: { [key: string]: boolean | string | number }
): { [key: string]: boolean | string | number } {
    return input;
}

async function* checkPermissionsAndCallTool(
    tool: Tool,
    toolUseID: string,
    siblingToolUseIDs: Set<string>,
    input: { [key: string]: boolean | string | number },
    context: ToolUseContext,
    canUseTool: CanUseToolFn,
    assistantMessage: AssistantMessage,
    shouldSkipPermissionCheck?: boolean
): AsyncGenerator<UserMessage | ProgressMessage, void> {
    // Validate input types with zod
    // (surprisingly, the model is not great at generating valid input)
    const isValidInput = tool.inputSchema.safeParse(input);
    if (!isValidInput.success) {
        yield createUserMessage([
            {
                type: 'tool_result',
                content: `InputValidationError: ${isValidInput.error.message}`,
                is_error: true,
                tool_use_id: toolUseID,
            },
        ]);
        return;
    }

    const normalizedInput = normalizeToolInput(tool, input);

    // Validate input values. Each tool has its own validation logic
    const isValidCall = await tool.validateInput?.(
        normalizedInput as never,
        context
    );
    if (isValidCall?.result === false) {
        yield createUserMessage([
            {
                type: 'tool_result',
                content: isValidCall!.message,
                is_error: true,
                tool_use_id: toolUseID,
            },
        ]);
        return;
    }

    // Check whether we have permission to use the tool,
    // and ask the user for permission if we don't
    const permissionResult = shouldSkipPermissionCheck
        ? ({ result: true } as const)
        : await canUseTool(tool, normalizedInput, context, assistantMessage);
    if (permissionResult.result === false) {
        yield createUserMessage([
            {
                type: 'tool_result',
                content: permissionResult.message,
                is_error: true,
                tool_use_id: toolUseID,
            },
        ]);
        return;
    }

    // Call the tool
    try {
        const generator = tool.call(
            normalizedInput as never,
            context,
            canUseTool
        );
        for await (const result of generator) {
            switch (result.type) {
                case 'result':
                    yield createUserMessage(
                        [
                            {
                                type: 'tool_result',
                                content: result.resultForAssistant,
                                tool_use_id: toolUseID,
                            },
                        ],
                        {
                            data: result.data,
                            resultForAssistant: result.resultForAssistant,
                        }
                    );
                    return;
                case 'progress':
                    yield createProgressMessage(
                        toolUseID,
                        siblingToolUseIDs,
                        result.content,
                        result.normalizedMessages,
                        result.tools
                    );
            }
        }
    } catch (error) {
        const content = formatError(error);
        console.log(error);
        yield createUserMessage([
            {
                type: 'tool_result',
                content,
                is_error: true,
                tool_use_id: toolUseID,
            },
        ]);
    }
}

function formatError(error: unknown): string {
    if (!(error instanceof Error)) {
        return String(error);
    }
    const parts = [error.message];
    if ('stderr' in error && typeof error.stderr === 'string') {
        parts.push(error.stderr);
    }
    if ('stdout' in error && typeof error.stdout === 'string') {
        parts.push(error.stdout);
    }
    const fullMessage = parts.filter(Boolean).join('\n');
    if (fullMessage.length <= 10000) {
        return fullMessage;
    }
    const halfLength = 5000;
    const start = fullMessage.slice(0, halfLength);
    const end = fullMessage.slice(-halfLength);
    return `${start}\n\n... [${fullMessage.length - 10000} characters truncated] ...\n\n${end}`;
}
