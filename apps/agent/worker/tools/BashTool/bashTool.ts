import {
    inputSchema,
    type Input,
    type Output,
} from '@repo/common/types/bashTool';
import { getGlobalConfig } from '@repo/common/utils/config';
import { bashTool } from '@worker/bridge';
import { logger } from '@worker/log';
import { queryHaiku } from '@worker/services/claude';
import type { Tool } from '@worker/tool';
import { EOL } from 'node:os';
import { PROMPT } from './prompt';

export const BashTool: Tool<Input, Output> = {
    name: 'Bash',
    async description({ command }: { command: string }) {
        try {
            const { textStream } = queryHaiku({
                systemPrompt: [
                    `You are a command description generator. Write a clear, concise description of what this command does in 5-10 words. Examples:

          Input: ls
          Output: Lists files in current directory

          Input: git status
          Output: Shows working tree status

          Input: npm install
          Output: Installs package dependencies

          Input: mkdir foo
          Output: Creates directory 'foo'`,
                ],
                userPrompt: `Describe this command: ${command}`,
            });
            let text = '';
            for await (const s of textStream) {
                text += s;
            }
            return text || 'Executes a bash command';
        } catch (error) {
            logger.error(error);
            return 'Executes a bash command';
        }
    },
    async prompt() {
        const config = getGlobalConfig();
        const modelName = config.largeModelName || '<Unknown Model>';
        // Substitute the placeholder in the static PROMPT string
        return PROMPT.replace(/{MODEL_NAME}/g, modelName);
    },
    isReadOnly() {
        return false;
    },
    inputSchema,
    userFacingName() {
        return 'Bash';
    },
    async isEnabled() {
        return true;
    },
    needsPermissions(): boolean {
        // Always check per-project permissions for BashTool
        return true;
    },
    async validateInput() {
        return { result: true };
    },
    renderResultForAssistant({ interrupted, stdout, stderr }: Output) {
        let errorMessage = stderr.trim();
        if (interrupted) {
            if (stderr) errorMessage += EOL;
            errorMessage +=
                '<error>Command was aborted before completion</error>';
        }
        const hasBoth = stdout.trim() && errorMessage;
        return `${stdout.trim()}${hasBoth ? '\n' : ''}${errorMessage.trim()}`;
    },
    async *call(
        { command, timeout = 120000 },
        _options: unknown,
        container?: Container
    ) {
        const result = await bashTool({ container, command, timeout });
        yield {
            type: 'result',
            resultForAssistant: this.renderResultForAssistant(result),
            data: result,
        };
    },
};
