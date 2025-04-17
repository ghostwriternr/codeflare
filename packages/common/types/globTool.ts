import { z } from "zod";

export const inputSchema = z.strictObject({
    pattern: z.string().describe('The glob pattern to match files against'),
    path: z
        .string()
        .optional()
        .describe(
            'The directory to search in. Defaults to the current working directory.'
        ),
});

export type Input = typeof inputSchema;
export type Output = {
    durationMs: number;
    numFiles: number;
    filenames: string[];
    truncated: boolean;
};
