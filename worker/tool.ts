import { z } from 'zod';

export interface Tool {
    name: string;
    description?: string;
    inputSchema: z.ZodObject<any>;
    inputJSONSchema?: Record<string, unknown>;
    prompt: (options: {
        dangerouslySkipPermissions: boolean;
    }) => Promise<string>;
}

export interface ToolUseContext {
    options: {
        commands: Command[];
        forkNumber: number;
        messageLogName: string;
        tools: Tool[];
        slowAndCapableModel: string;
        verbose: boolean;
        dangerouslySkipPermissions: boolean;
        maxThinkingTokens: number;
    };
    messageId: string | undefined;
    readFileTimestamps: { [filename: string]: number };
    abortController: AbortController;
}
