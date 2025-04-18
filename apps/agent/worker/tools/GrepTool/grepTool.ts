import {
    inputSchema,
    type Input,
    type Output,
} from '@repo/common/types/grepTool';
import { grepTool } from '@worker/bridge';
import type { Tool } from '@worker/tool';
import { DESCRIPTION, TOOL_NAME_FOR_PROMPT } from './prompt';

const MAX_RESULTS = 100;

export const GrepTool: Tool<Input, Output> = {
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
        return true;
    },
    async validateInput() {
        return { result: true };
    },
    async prompt() {
        return DESCRIPTION;
    },
    renderResultForAssistant({ numFiles, filenames }) {
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
    async *call({ pattern, path, include }, _options, container) {
        const output = await grepTool({ pattern, path, include, container });
        yield {
            type: 'result',
            resultForAssistant: this.renderResultForAssistant(output),
            data: output,
        };
    },
};
