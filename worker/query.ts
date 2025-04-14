import { CoreAssistantMessage, CoreToolMessage, CoreUserMessage } from 'ai';
import { formatSystemPromptWithContext, querySonnet } from './services/claude';
import { ToolUseContext } from './tool';

export async function query(
    messages: (CoreUserMessage | CoreAssistantMessage | CoreToolMessage)[],
    systemPrompt: string[],
    context: { [k: string]: string },
    toolUseContext: ToolUseContext
) {
    const fullSystemPrompt = formatSystemPromptWithContext(
        systemPrompt,
        context
    );
    return querySonnet(
        messages,
        fullSystemPrompt,
        toolUseContext.options.maxThinkingTokens,
        toolUseContext.options.tools
    );
}
