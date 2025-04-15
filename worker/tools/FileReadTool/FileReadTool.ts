import { z } from 'zod';
import { fileReadTool } from '../../bridge';
import { addLineNumbers } from '../../utils/file';
import { DESCRIPTION, PROMPT } from './prompt';

const inputSchema = z.strictObject({
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

export const FileReadTool = {
    name: 'View',
    async description() {
        return DESCRIPTION;
    },
    async prompt() {
        return PROMPT;
    },
    inputSchema,
    isReadOnly() {
        return true;
    },
    userFacingName() {
        return 'Read';
    },
    async isEnabled() {
        return true;
    },
    needsPermissions() {
        // TODO(@ghostwriternr): Fix permissions when the time arises. Yolo for now.
        // return !hasReadPermission(file_path || getCwd());
        return false;
    },
    //   renderToolUseMessage(input, { verbose }) {
    //     const { file_path, ...rest } = input
    //     const entries = [
    //       ['file_path', verbose ? file_path : relative(getCwd(), file_path)],
    //       ...Object.entries(rest),
    //     ]
    //     return entries
    //       .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    //       .join(', ')
    //   },
    //   renderToolResultMessage(output, { verbose }) {
    //     // TODO: Render recursively
    //     switch (output.type) {
    //       case 'image':
    //         return (
    //           <Box justifyContent="space-between" overflowX="hidden" width="100%">
    //             <Box flexDirection="row">
    //               <Text>&nbsp;&nbsp;⎿ &nbsp;</Text>
    //               <Text>Read image</Text>
    //             </Box>
    //           </Box>
    //         )
    //       case 'text': {
    //         const { filePath, content, numLines } = output.file
    //         const contentWithFallback = content || '(No content)'
    //         return (
    //           <Box justifyContent="space-between" overflowX="hidden" width="100%">
    //             <Box flexDirection="row">
    //               <Text>&nbsp;&nbsp;⎿ &nbsp;</Text>
    //               <Box flexDirection="column">
    //                 <HighlightedCode
    //                   code={
    //                     verbose
    //                       ? contentWithFallback
    //                       : contentWithFallback
    //                           .split('\n')
    //                           .slice(0, MAX_LINES_TO_RENDER)
    //                           .filter(_ => _.trim() !== '')
    //                           .join('\n')
    //                   }
    //                   language={extname(filePath).slice(1)}
    //                 />
    //                 {!verbose && numLines > MAX_LINES_TO_RENDER && (
    //                   <Text color={getTheme().secondaryText}>
    //                     ... (+{numLines - MAX_LINES_TO_RENDER} lines)
    //                   </Text>
    //                 )}
    //               </Box>
    //             </Box>
    //           </Box>
    //         )
    //       }
    //     }
    //   },
    //   renderToolUseRejectedMessage() {
    //     return <FallbackToolUseRejectedMessage />
    //   },
    async validateInput() {
        // const fullFilePath = normalizeFilePath(file_path);

        // if (!existsSync(fullFilePath)) {
        //     // Try to find a similar file with a different extension
        //     const similarFilename = findSimilarFile(fullFilePath);
        //     let message = 'File does not exist.';

        //     // If we found a similar file, suggest it to the assistant
        //     if (similarFilename) {
        //         message += ` Did you mean ${similarFilename}?`;
        //     }

        //     return {
        //         result: false,
        //         message,
        //     };
        // }

        // // Get file stats to check size
        // const stats = statSync(fullFilePath);
        // const fileSize = stats.size;
        // const ext = path.extname(fullFilePath).toLowerCase();

        // // Skip size check for image files - they have their own size limits
        // if (!IMAGE_EXTENSIONS.has(ext)) {
        //     // If file is too large and no offset/limit provided
        //     if (fileSize > MAX_OUTPUT_SIZE && !offset && !limit) {
        //         return {
        //             result: false,
        //             message: formatFileSizeError(fileSize),
        //             meta: { fileSize },
        //         };
        //     }
        // }

        return { result: true };
    },
    async *call({
        file_path,
        offset = 1,
        limit = undefined,
    }: {
        file_path: string;
        offset?: number;
        limit?: number;
    }) {
        const data = await fileReadTool({
            file_path,
            offset,
            limit,
        });
        yield {
            type: 'result',
            data,
            resultForAssistant: this.renderResultForAssistant(data),
        };
    },
    renderResultForAssistant(data: { type: string; file: any }) {
        switch (data.type) {
            case 'image':
                return [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            data: data.file.base64,
                            media_type: data.file.type,
                        },
                    },
                ];
            case 'text':
                return addLineNumbers(data.file);
        }
    },
};
