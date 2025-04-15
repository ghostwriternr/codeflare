import { fileEditTool } from '../../bridge';
import { addLineNumbers } from '../../utils/file';
import { z } from 'zod';
import { DESCRIPTION } from './prompt';

const inputSchema = z.strictObject({
    file_path: z.string().describe('The absolute path to the file to modify'),
    old_string: z.string().describe('The text to replace'),
    new_string: z.string().describe('The text to replace it with'),
});

export type In = typeof inputSchema;

// Number of lines of context to include before/after the change in our result message
const N_LINES_SNIPPET = 4;

export type Output = {
    filePath: string;
    oldString: string;
    newString: string;
    originalFile: string;
    structuredPatch: { newStart: number; newEnd: number }[];
};

export const FileEditTool = {
    name: 'Edit',
    async description() {
        return 'A tool for editing files';
    },
    async prompt() {
        return DESCRIPTION;
    },
    inputSchema,
    userFacingName({
        old_string,
        new_string,
    }: {
        old_string: string;
        new_string: string;
    }) {
        if (old_string === '') return 'Create';
        if (new_string === '') return 'Delete';
        return 'Update';
    },
    async isEnabled() {
        return true;
    },
    needsPermissions() {
        // TODO(@ghostwriternr): Implement permissions
        // return !hasWritePermission(file_path);
        return true;
    },
    isReadOnly() {
        return false;
    },
    // renderToolUseMessage(input, { verbose }) {
    //     return `file_path: ${verbose ? input.file_path : relative(getCwd(), input.file_path)}`;
    // },
    //   renderToolResultMessage({ filePath, structuredPatch }, { verbose }) {
    //     return (
    //       <FileEditToolUpdatedMessage
    //         filePath={filePath}
    //         structuredPatch={structuredPatch}
    //         verbose={verbose}
    //       />
    //     )
    //   },
    //   renderToolUseRejectedMessage(
    //     { file_path, old_string, new_string },
    //     { columns, verbose },
    //   ) {
    //     try {
    //       const { patch } = applyEdit(file_path, old_string, new_string)
    //       return (
    //         <Box flexDirection="column">
    //           <Text>
    //             {'  '}⎿{' '}
    //             <Text color={getTheme().error}>
    //               User rejected {old_string === '' ? 'write' : 'update'} to{' '}
    //             </Text>
    //             <Text bold>
    //               {verbose ? file_path : relative(getCwd(), file_path)}
    //             </Text>
    //           </Text>
    //           {intersperse(
    //             patch.map(patch => (
    //               <Box flexDirection="column" paddingLeft={5} key={patch.newStart}>
    //                 <StructuredDiff patch={patch} dim={true} width={columns - 12} />
    //               </Box>
    //             )),
    //             i => (
    //               <Box paddingLeft={5} key={`ellipsis-${i}`}>
    //                 <Text color={getTheme().secondaryText}>...</Text>
    //               </Box>
    //             ),
    //           )}
    //         </Box>
    //       )
    //     } catch (e) {
    //       // Handle the case where while we were showing the diff, the user manually made the change.
    //       // TODO: Find a way to show the diff in this case
    //       logError(e)
    //       return (
    //         <Box flexDirection="column">
    //           <Text>{'  '}⎿ (No changes)</Text>
    //         </Box>
    //       )
    //     }
    //   },
    async validateInput() {
        // TODO(@ghostwriternr): Implement validation
        // if (old_string === new_string) {
        //     return {
        //         result: false,
        //         message:
        //             'No changes to make: old_string and new_string are exactly the same.',
        //         meta: {
        //             old_string,
        //         },
        //     } as ValidationResult;
        // }

        // const fullFilePath = isAbsolute(file_path)
        //     ? file_path
        //     : resolve(getCwd(), file_path);

        // if (existsSync(fullFilePath) && old_string === '') {
        //     return {
        //         result: false,
        //         message: 'Cannot create new file - file already exists.',
        //     };
        // }

        // if (!existsSync(fullFilePath) && old_string === '') {
        //     return {
        //         result: true,
        //     };
        // }

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

        // if (fullFilePath.endsWith('.ipynb')) {
        //     return {
        //         result: false,
        //         message: `File is a Jupyter Notebook. Use the ${NotebookEditTool.name} to edit this file.`,
        //     };
        // }

        // const readTimestamp = readFileTimestamps[fullFilePath];
        // if (!readTimestamp) {
        //     return {
        //         result: false,
        //         message:
        //             'File has not been read yet. Read it first before writing to it.',
        //         meta: {
        //             isFilePathAbsolute: String(isAbsolute(file_path)),
        //         },
        //     };
        // }

        // // Check if file exists and get its last modified time
        // const stats = statSync(fullFilePath);
        // const lastWriteTime = stats.mtimeMs;
        // if (lastWriteTime > readTimestamp) {
        //     return {
        //         result: false,
        //         message:
        //             'File has been modified since read, either by the user or by a linter. Read it again before attempting to write it.',
        //     };
        // }

        // const enc = detectFileEncoding(fullFilePath);
        // const file = readFileSync(fullFilePath, enc);
        // if (!file.includes(old_string)) {
        //     return {
        //         result: false,
        //         message: `String to replace not found in file.`,
        //         meta: {
        //             isFilePathAbsolute: String(isAbsolute(file_path)),
        //         },
        //     };
        // }

        // const matches = file.split(old_string).length - 1;
        // if (matches > 1) {
        //     return {
        //         result: false,
        //         message: `Found ${matches} matches of the string to replace. For safety, this tool only supports replacing exactly one occurrence at a time. Add more lines of context to your edit and try again.`,
        //         meta: {
        //             isFilePathAbsolute: String(isAbsolute(file_path)),
        //         },
        //     };
        // }

        return { result: true };
    },
    async *call({
        file_path,
        old_string,
        new_string,
    }: {
        file_path: string;
        old_string: string;
        new_string: string;
    }) {
        const data = await fileEditTool({
            filePath: file_path,
            oldString: old_string,
            newString: new_string,
        });
        yield {
            type: 'result',
            resultForAssistant: this.renderResultForAssistant(data),
            data,
        };
    },
    renderResultForAssistant({
        filePath,
        originalFile,
        oldString,
        newString,
    }: Output) {
        const { snippet, startLine } = getSnippet(
            originalFile || '',
            oldString,
            newString
        );
        return `The file ${filePath} has been updated. Here's the result of running \`cat -n\` on a snippet of the edited file:
${addLineNumbers({
    content: snippet,
    startLine,
})}`;
    },
};

export function getSnippet(
    initialText: string,
    oldStr: string,
    newStr: string
): { snippet: string; startLine: number } {
    const before = initialText.split(oldStr)[0] ?? '';
    const replacementLine = before.split(/\r?\n/).length - 1;
    const newFileLines = initialText.replace(oldStr, newStr).split(/\r?\n/);
    // Calculate the start and end line numbers for the snippet
    const startLine = Math.max(0, replacementLine - N_LINES_SNIPPET);
    const endLine =
        replacementLine + N_LINES_SNIPPET + newStr.split(/\r?\n/).length;
    // Get snippet
    const snippetLines = newFileLines.slice(startLine, endLine + 1);
    const snippet = snippetLines.join('\n');
    return { snippet, startLine: startLine + 1 };
}
