import { grepTool } from '../../bridge';
import { DESCRIPTION, TOOL_NAME_FOR_PROMPT } from './prompt';
import { z } from 'zod';

const inputSchema = z.strictObject({
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

const MAX_RESULTS = 100;

export type Output = {
    durationMs: number;
    numFiles: number;
    filenames: string[];
};

export const GrepTool = {
    name: TOOL_NAME_FOR_PROMPT,
    async description() {
        return DESCRIPTION;
    },
    userFacingName() {
        return 'Search';
    },
    inputSchema,
    isReadOnly() {
        return true;
    },
    async isEnabled() {
        return true;
    },
    needsPermissions() {
        // return !hasReadPermission(path || getCwd());
        return true;
    },
    async prompt() {
        return DESCRIPTION;
    },
    // renderToolUseMessage({ pattern, path, include }, { verbose }) {
    //     const { absolutePath, relativePath } =
    //         getAbsoluteAndRelativePaths(path);
    //     return `pattern: "${pattern}"${relativePath || verbose ? `, path: "${verbose ? absolutePath : relativePath}"` : ''}${include ? `, include: "${include}"` : ''}`;
    // },
    //   renderToolUseRejectedMessage() {
    //     return <FallbackToolUseRejectedMessage />
    //   },
    //   renderToolResultMessage(output) {
    //     // Handle string content for backward compatibility
    //     if (typeof output === 'string') {
    //       // Convert string to Output type using tmpDeserializeOldLogResult if needed
    //       output = output as unknown as Output
    //     }

    //     return (
    //       <Box justifyContent="space-between" width="100%">
    //         <Box flexDirection="row">
    //           <Text>&nbsp;&nbsp;⎿ &nbsp;Found </Text>
    //           <Text bold>{output.numFiles} </Text>
    //           <Text>
    //             {output.numFiles === 0 || output.numFiles > 1 ? 'files' : 'file'}
    //           </Text>
    //         </Box>
    //         <Cost costUSD={0} durationMs={output.durationMs} debug={false} />
    //       </Box>
    //     )
    //   },
    renderResultForAssistant({ numFiles, filenames }: Output) {
        if (numFiles === 0) {
            return 'No files found';
        }
        let result = `Found ${numFiles} file${numFiles === 1 ? '' : 's'}\n${filenames.slice(0, MAX_RESULTS).join('\n')}`;
        if (numFiles > MAX_RESULTS) {
            result +=
                '\n(Results are truncated. Consider using a more specific path or pattern.)';
        }
        return result;
    },
    async *call({
        pattern,
        path,
        include,
    }: {
        pattern: string;
        path?: string;
        include?: string;
    }, _options: unknown, container: Container) {
        const output = await grepTool({ pattern, path, include });
        yield {
            type: 'result',
            resultForAssistant: this.renderResultForAssistant(output),
            data: output,
        };
    },
};
