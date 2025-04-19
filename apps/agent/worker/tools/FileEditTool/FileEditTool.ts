import {
    inputSchema,
    type Input,
    type Output,
} from '@repo/common/types/fileEditTool';
import { fileEditTool } from '@worker/bridge';
import type { Tool } from '@worker/tool';
import { addLineNumbers } from '@worker/utils/file';
import { DESCRIPTION } from './prompt';

// Number of lines of context to include before/after the change in our result message
const N_LINES_SNIPPET = 4;

export const FileEditTool: Tool<Input, Output> = {
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
        return true;
    },
    isReadOnly() {
        return false;
    },
    async validateInput() {
        return { result: true };
    },
    async *call({ file_path, old_string, new_string }, _options, container) {
        const data = await fileEditTool({
            filePath: file_path,
            oldString: old_string,
            newString: new_string,
            container,
        });
        yield {
            type: 'result',
            resultForAssistant: this.renderResultForAssistant(data),
            data,
        };
    },
    renderResultForAssistant({ filePath, originalFile, oldString, newString }) {
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
