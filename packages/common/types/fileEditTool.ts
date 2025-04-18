import { z } from 'zod';

export const inputSchema = z.strictObject({
    file_path: z.string().describe('The absolute path to the file to modify'),
    old_string: z.string().describe('The text to replace'),
    new_string: z.string().describe('The text to replace it with'),
});

export type StructuredPatch = {
    lines: string[];
    oldStart: number;
    newStart: number;
    oldLines: number;
    newLines: number;
}[];

export type Input = typeof inputSchema;
export type Output = {
    filePath: string;
    relativePath: string;
    oldString: string;
    newString: string;
    originalFile: string;
    structuredPatch: StructuredPatch;
};
