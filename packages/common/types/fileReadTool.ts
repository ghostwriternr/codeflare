import { z } from 'zod';

export const inputSchema = z.strictObject({
    file_path: z.string().describe('The absolute path to the file to read'),
    offset: z
        .number()
        .optional()
        .describe(
            'The line number to start reading from. Only provide if the file is too large to read at once'
        ),
    limit: z
        .number()
        .optional()
        .describe(
            'The number of lines to read. Only provide if the file is too large to read at once.'
        ),
});

export type Input = typeof inputSchema;
export type Output =
    | {
          type: 'text';
          file: {
              filePath: string;
              relativePath: string;
              content: string;
              numLines: number;
              startLine: number;
              totalLines: number;
          };
      }
    | {
          type: 'image';
          source: {
              type: 'base64';
              data: string;
              media_type:
                  | 'image/jpeg'
                  | 'image/png'
                  | 'image/gif'
                  | 'image/webp';
          };
      };
