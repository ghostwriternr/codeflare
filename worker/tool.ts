import { ToolSet } from 'ai';
import { z } from 'zod';

export interface Tool {
    name: string;
    description: (options: { command: string }) => Promise<string>;
    inputSchema: z.ZodObject<any>;
    prompt: () => Promise<string>;
}

export interface ToolUseContext {
    options: {
        forkNumber: number;
        messageLogName: string;
        tools: ToolSet;
        slowAndCapableModel: string;
        verbose: boolean;
        maxThinkingTokens: number;
    };
    messageId: string | undefined;
    abortController: AbortController;
}

export interface ValidationResult {
    result: boolean;
    message?: string;
}
