import { AssistantMessage } from '../query';
import { Tool } from '../tool';

export type CanUseToolFn = (
    tool: Tool,
    input: { [key: string]: unknown },
    toolUseContext: ToolUseContext,
    assistantMessage: AssistantMessage
) => Promise<{ result: true } | { result: false; message: string }>;
