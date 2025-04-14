import { Message, StreamTextOnFinishCallback, ToolSet } from 'ai';
import { formatSystemPromptWithContext, querySonnet } from './services/claude';
import { ToolUseContext } from './tool';

export async function query(
    messages: Message[],
    systemPrompt: string[],
    context: { [k: string]: string },
    toolUseContext: ToolUseContext,
    onFinish: StreamTextOnFinishCallback<ToolSet>
) {
    const fullSystemPrompt = formatSystemPromptWithContext(
        systemPrompt,
        context
    );
    return querySonnet(
        messages,
        fullSystemPrompt,
        toolUseContext.options.maxThinkingTokens,
        toolUseContext.options.tools,
        onFinish
    );
}
