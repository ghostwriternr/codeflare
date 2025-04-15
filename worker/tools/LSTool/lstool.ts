import { z } from 'zod';
import { lsTool } from '../../bridge';
import { DESCRIPTION } from './description';

const inputSchema = z.strictObject({
    path: z
        .string()
        .describe(
            'The absolute path to the directory to list (must be absolute, not relative)'
        ),
});

// TODO: Kill this tool and use bash instead
export const LSTool = {
    name: 'LS',
    async description() {
        return DESCRIPTION;
    },
    inputSchema,
    userFacingName() {
        return 'List';
    },
    async isEnabled() {
        return true;
    },
    isReadOnly() {
        return true;
    },
    needsPermissions() {
        // TODO(@ghostwriternr): Fix this if we want to restrict paths
        return true;
    },
    async prompt() {
        return DESCRIPTION;
    },
    renderResultForAssistant(data: string) {
        return data;
    },
    // renderToolUseMessage({ path }, { verbose }) {
    //   const absolutePath = path
    //     ? isAbsolute(path)
    //       ? path
    //       : resolve(getCwd(), path)
    //     : undefined
    //   const relativePath = absolutePath ? relative(getCwd(), absolutePath) : '.'
    //   return `path: "${verbose ? path : relativePath}"`
    // },
    // renderToolUseRejectedMessage() {
    //   return <FallbackToolUseRejectedMessage />
    // },
    // renderToolResultMessage(content, { verbose }) {
    //   if (typeof content !== 'string') {
    //     return null
    //   }
    //   const result = content.replace(TRUNCATED_MESSAGE, '')
    //   if (!result) {
    //     return null
    //   }
    //   return (
    //     <Box justifyContent="space-between" width="100%">
    //       <Box>
    //         <Text>&nbsp;&nbsp;⎿ &nbsp;</Text>
    //         <Box flexDirection="column" paddingLeft={0}>
    //           {result
    //             .split('\n')
    //             .filter(_ => _.trim() !== '')
    //             .slice(0, verbose ? undefined : MAX_LINES)
    //             .map((_, i) => (
    //               <Text key={i}>{_}</Text>
    //             ))}
    //           {!verbose && result.split('\n').length > MAX_LINES && (
    //             <Text color={getTheme().secondaryText}>
    //               ... (+{result.split('\n').length - MAX_LINES} items)
    //             </Text>
    //           )}
    //         </Box>
    //       </Box>
    //     </Box>
    //   )
    // },
    async *call({ path }: { path: string }) {
        const result = await lsTool({ path });
        yield {
            type: 'result',
            data: result.user,
            resultForAssistant: this.renderResultForAssistant(result.assistant),
        };
    },
};
