import { inputSchema, type Output } from '@repo/common/types/globTool';
import { globTool } from '@worker/bridge';
import { DESCRIPTION, TOOL_NAME_FOR_PROMPT } from './prompt';

export const GlobTool = {
    name: TOOL_NAME_FOR_PROMPT,
    async description() {
        return DESCRIPTION;
    },
    userFacingName() {
        return 'Search';
    },
    inputSchema,
    async isEnabled() {
        return true;
    },
    isReadOnly() {
        return true;
    },
    needsPermissions() {
        // TODO(@ghostwriternr): Fix this
        // return !hasReadPermission(path || getCwd());
        return true;
    },
    async prompt() {
        return DESCRIPTION;
    },
    // renderToolUseMessage({ pattern, path }, { verbose }) {
    //     const absolutePath = path
    //         ? isAbsolute(path)
    //             ? path
    //             : resolve(getCwd(), path)
    //         : undefined;
    //     const relativePath = absolutePath
    //         ? relative(getCwd(), absolutePath)
    //         : undefined;
    //     return `pattern: "${pattern}"${relativePath || verbose ? `, path: "${verbose ? absolutePath : relativePath}"` : ''}`;
    // },
    //   renderToolUseRejectedMessage() {
    //     return <FallbackToolUseRejectedMessage />
    //   },
    //   renderToolResultMessage(output) {
    //     // Handle string content for backward compatibility
    //     if (typeof output === 'string') {
    //       output = JSON.parse(output) as Output
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
    async *call({ pattern, path }: { pattern: string; path?: string }, _options: unknown, container: Container) {
        const output = await globTool({ pattern, path, container });
        yield {
            type: 'result',
            resultForAssistant: this.renderResultForAssistant(output),
            data: output,
        };
    },
    renderResultForAssistant(output: Output) {
        let result = output.filenames.join('\n');
        if (output.filenames.length === 0) {
            result = 'No files found';
        }
        // Only add truncation message if results were actually truncated
        else if (output.truncated) {
            result +=
                '\n(Results are truncated. Consider using a more specific path or pattern.)';
        }
        return result;
    },
};
