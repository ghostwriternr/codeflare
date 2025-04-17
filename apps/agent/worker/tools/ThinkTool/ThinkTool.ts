import { inputSchema } from '@repo/common/types/thinkTool';
import type { Tool } from '@worker/tool';
import { DESCRIPTION, PROMPT } from './prompt';

export const ThinkTool: Tool = {
    name: 'Think',
    userFacingName: () => 'Think',
    description: async () => DESCRIPTION,
    inputSchema,
    isEnabled: async () => Boolean(process.env.THINK_TOOL),
    isReadOnly: () => true,
    needsPermissions: () => false,
    prompt: async () => PROMPT,
    async *call(input: { thought: string }) {
        yield {
            type: 'result',
            resultForAssistant: 'Your thought has been logged.',
            data: { thought: input.thought },
        };
    },
    // This is never called -- it's special-cased in AssistantToolUseMessage
    renderToolUseMessage(input: { thought: string }) {
        return input.thought;
    },
    renderResultForAssistant: () => 'Your thought has been logged.',
};
