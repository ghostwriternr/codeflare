import { z } from 'zod';

export const inputSchema = z.object({
    thought: z.string().describe('Your thoughts.'),
});

export type Input = typeof inputSchema;
export type Output = {
    thought: string;
};
