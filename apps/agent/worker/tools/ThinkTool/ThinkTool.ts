import { z } from 'zod';
import { DESCRIPTION, PROMPT } from './prompt';

const thinkToolSchema = z.object({
    thought: z.string().describe('Your thoughts.'),
});

export const ThinkTool = {
    name: 'Think',
    userFacingName: () => 'Think',
    description: async () => DESCRIPTION,
    inputSchema: thinkToolSchema,
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
