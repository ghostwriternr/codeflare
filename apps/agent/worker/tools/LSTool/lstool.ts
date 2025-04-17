import { inputSchema, type Input, type Output } from '@repo/common/types/lsTool';
import { lsTool } from '@worker/bridge';
import type { Tool } from '@worker/tool';
import { DESCRIPTION } from './prompt';

// TODO: Kill this tool and use bash instead
export const LSTool: Tool<Input, Output> = {
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
    async *call({ path }: { path: string }, _options: unknown, container?: Container) {
        const result = await lsTool({ path, container });
        yield {
            type: 'result',
            data: result.user,
            resultForAssistant: this.renderResultForAssistant(result.assistant),
        };
    },
};
