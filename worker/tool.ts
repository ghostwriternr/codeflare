import type { ToolSet } from 'ai';
import { z } from 'zod';

export interface Tool {
    name: string;
    description: (options: { command: string }) => Promise<string>;
    inputSchema: z.ZodObject<any>;
    prompt: () => Promise<string>;
    isEnabled: () => Promise<boolean>;
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
}

export interface ValidationResult {
    result: boolean;
    message?: string;
}
