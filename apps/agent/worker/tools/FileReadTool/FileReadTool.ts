import {
    inputSchema,
    type Input,
    type Output,
} from '@repo/common/types/fileReadTool';
import { fileReadTool } from '@worker/bridge';
import type { Tool } from '@worker/tool';
import { addLineNumbers } from '@worker/utils/file';
import { DESCRIPTION, PROMPT } from './prompt';

export const FileReadTool: Tool<Input, Output> = {
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
        return false;
    },
    async validateInput() {
        return { result: true };
    },
    async *call(
        { file_path, offset = 1, limit = undefined },
        _options,
        container
    ) {
        const data = await fileReadTool({
            file_path,
            offset,
            limit,
            container,
        });
        yield {
            type: 'result',
            data,
            resultForAssistant: this.renderResultForAssistant(data),
        };
    },
    renderResultForAssistant(data) {
        switch (data.type) {
            case 'image':
                // TODO(@ghostwriternr): This is most likely wrong, but we can
                // deal with it when we actually support images.
                return JSON.stringify([
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            data: data.source.data,
                            media_type: data.source.media_type,
                        },
                    },
                ]);
            case 'text':
                return addLineNumbers(data.file);
        }
    },
};
