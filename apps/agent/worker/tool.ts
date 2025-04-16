import type { ToolSet } from 'ai';

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
