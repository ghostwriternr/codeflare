import { z } from 'zod';

export const inputSchema = z.strictObject({
    path: z
        .string()
        .describe(
            'The absolute path to the directory to list (must be absolute, not relative)'
        ),
});

export type Input = typeof inputSchema;
export type Output = { user: string; assistant: string };
