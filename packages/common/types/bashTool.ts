import { z } from 'zod';

export const inputSchema = z.strictObject({
    command: z.string().describe('The command to execute'),
    timeout: z
        .number()
        .optional()
        .describe('Optional timeout in milliseconds (max 600000)'),
});

export type Input = typeof inputSchema;
export type Output = {
    stdout: string;
    stdoutLines: number; // Total number of lines in original stdout, even if `stdout` is now truncated
    stderr: string;
    stderrLines: number; // Total number of lines in original stderr, even if `stderr` is now truncated
    interrupted: boolean;
};
