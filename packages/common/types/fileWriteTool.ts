import { z } from 'zod';
import type { StructuredPatch } from './fileEditTool';

export const inputSchema = z.strictObject({
    file_path: z
        .string()
        .describe(
            'The absolute path to the file to write (must be absolute, not relative)'
        ),
    content: z.string().describe('The content to write to the file'),
});

export type Input = typeof inputSchema;
export type Output = {
    type: 'create' | 'update';
    filePath: string;
    relativePath: string;
    content: string;
    structuredPatch: StructuredPatch;
};
