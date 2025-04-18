import { z } from 'zod';

export const inputSchema = z.strictObject({
    pattern: z
        .string()
        .describe(
            'The regular expression pattern to search for in file contents'
        ),
    path: z
        .string()
        .optional()
        .describe(
            'The directory to search in. Defaults to the current working directory.'
        ),
    include: z
        .string()
        .optional()
        .describe(
            'File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")'
        ),
});

export type Input = typeof inputSchema;
export type Output = {
    durationMs: number;
    numFiles: number;
    filenames: string[];
    relativeFileNames: string[];
};
