import { z } from 'zod';

export interface Tool {
    name: string;
    description: (options: { command: string }) => Promise<string>;
    inputSchema: z.ZodObject<any>;
    prompt: () => Promise<string>;
    isEnabled: () => Promise<boolean>;
}
