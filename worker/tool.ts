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
