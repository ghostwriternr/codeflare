import type { ToolExecutionOptions, ToolSet } from 'ai';
import type { z } from 'zod';

export type ToolCallResult<OutSchema extends Record<string, unknown>> = {
    type: 'result';
    resultForAssistant: string;
    data: OutSchema;
};

/**
 * Interface for a tool that can be executed by the agent.
 */
export interface Tool<
    InSchema extends z.ZodObject<z.ZodRawShape>,
    OutSchema extends Record<string, unknown>,
> {
    name: string;
    userFacingName: (input: z.infer<InSchema>) => string;
    description: (options: { command: string }) => Promise<string>;
    inputSchema: InSchema;
    isEnabled: () => Promise<boolean>;
    isReadOnly: () => boolean;
    needsPermissions: () => boolean;
    prompt: () => Promise<string>;
    validateInput: () => Promise<ValidationResult>;
    call: (
        input: z.infer<InSchema>,
        options: ToolExecutionOptions,
        container?: Container
    ) => AsyncGenerator<ToolCallResult<OutSchema>, void, unknown>;
    renderResultForAssistant: (data: OutSchema) => string;
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
