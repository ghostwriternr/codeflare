import {
    inputSchema,
    type Input,
    type Output,
} from '@repo/common/types/globTool';
import { globTool } from '@worker/bridge';
import type { Tool } from '@worker/tool';
import { DESCRIPTION, TOOL_NAME_FOR_PROMPT } from './prompt';

export const GlobTool: Tool<Input, Output> = {
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
        return true;
    },
    async validateInput() {
        return { result: true };
    },
    async prompt() {
        return DESCRIPTION;
    },
    async *call({ pattern, path }, _options, container) {
        const output = await globTool({ pattern, path, container });
        yield {
            type: 'result',
            resultForAssistant: this.renderResultForAssistant(output),
            data: output,
        };
    },
    renderResultForAssistant(output) {
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
