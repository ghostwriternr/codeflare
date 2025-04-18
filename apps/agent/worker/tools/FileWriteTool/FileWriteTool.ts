import {
    inputSchema,
    type Input,
    type Output,
} from '@repo/common/types/fileWriteTool';
import { fileWriteTool } from '@worker/bridge';
import type { Tool } from '@worker/tool';
import { addLineNumbers } from '@worker/utils/file';
import { PROMPT } from './prompt';

const MAX_LINES_TO_RENDER_FOR_ASSISTANT = 16000;
const TRUNCATED_MESSAGE =
    '<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with Grep in order to find the line numbers of what you are looking for.</NOTE>';

export const FileWriteTool: Tool<Input, Output> = {
    name: 'Replace',
    async description() {
        return 'Write a file to the local filesystem.';
    },
    userFacingName: () => 'Write',
    async prompt() {
        return PROMPT;
    },
    inputSchema,
    async isEnabled() {
        return true;
    },
    isReadOnly() {
        return false;
    },
    needsPermissions() {
        return true;
    },
    async validateInput() {
        return { result: true };
    },
    async *call({ file_path, content }, _options, container) {
        const data = await fileWriteTool({
            file_path,
            content,
            container,
        });
        yield {
            type: 'result',
            data,
            resultForAssistant: this.renderResultForAssistant(data),
        };
    },
    renderResultForAssistant({ filePath, content, type }) {
        switch (type) {
            case 'create':
                return `File created successfully at: ${filePath}`;
            case 'update':
                return `The file ${filePath} has been updated. Here's the result of running \`cat -n\` on a snippet of the edited file:
${addLineNumbers({
    content:
        content.split(/\r?\n/).length > MAX_LINES_TO_RENDER_FOR_ASSISTANT
            ? content
                  .split(/\r?\n/)
                  .slice(0, MAX_LINES_TO_RENDER_FOR_ASSISTANT)
                  .join('\n') + TRUNCATED_MESSAGE
            : content,
    startLine: 1,
})}`;
        }
    },
};
