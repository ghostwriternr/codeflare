import { inputSchema, type Output } from '@repo/common/types/bashTool';
import { logError } from '@repo/common/utils/log';
import { EOL } from 'node:os';
import { bashTool } from '@worker/bridge';
import { queryHaiku } from '@worker/services/claude';
import type { ValidationResult } from '@worker/tool';
import { getGlobalConfig } from '@repo/common/utils/config';
import { PROMPT } from './prompt';

export const BashTool = {
    name: 'Bash',
    async description({ command }: { command: string }) {
        try {
            console.log('Generating description for command', command);
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
            console.log('description for bash tool', text);
            return text || 'Executes a bash command';
        } catch (error) {
            logError(error);
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
    async validateInput(): Promise<ValidationResult> {
        // TODO(@ghostwriternr): Implement this when doing validations proper
        // const commands = splitCommand(command);
        // for (const cmd of commands) {
        //     const parts = cmd.split(' ');
        //     const baseCmd = parts[0];

        //     // Check if command is banned
        //     if (baseCmd && BANNED_COMMANDS.includes(baseCmd.toLowerCase())) {
        //         return {
        //             result: false,
        //             message: `Command '${baseCmd}' is not allowed for security reasons`,
        //         };
        //     }

        //     // Special handling for cd command
        //     if (baseCmd === 'cd' && parts[1]) {
        //         const targetDir = parts[1]!.replace(/^['"]|['"]$/g, ''); // Remove quotes if present
        //         const fullTargetDir = isAbsolute(targetDir)
        //             ? targetDir
        //             : resolve(getCwd(), targetDir);
        //         if (
        //             !isInDirectory(
        //                 relative(getOriginalCwd(), fullTargetDir),
        //                 relative(getCwd(), getOriginalCwd())
        //             )
        //         ) {
        //             return {
        //                 result: false,
        //                 message: `ERROR: cd to '${fullTargetDir}' was blocked. For security, ${PRODUCT_NAME} may only change directories to child directories of the original working directory (${getOriginalCwd()}) for this session.`,
        //             };
        //         }
        //     }
        // }

        return { result: true };
    },
    //   renderToolUseMessage({ command }) {
    //     // Clean up any command that uses the quoted HEREDOC pattern
    //     if (command.includes("\"$(cat <<'EOF'")) {
    //       const match = command.match(
    //         /^(.*?)"?\$\(cat <<'EOF'\n([\s\S]*?)\n\s*EOF\n\s*\)"(.*)$/,
    //       )
    //       if (match && match[1] && match[2]) {
    //         const prefix = match[1]
    //         const content = match[2]
    //         const suffix = match[3] || ''
    //         return `${prefix.trim()} "${content.trim()}"${suffix.trim()}`
    //       }
    //     }
    //     return command
    //   },
    //   renderToolUseRejectedMessage() {
    //     return <FallbackToolUseRejectedMessage />
    //   },

    //   renderToolResultMessage(content, { verbose }) {
    //     return <BashToolResultMessage content={content} verbose={verbose} />
    //   },
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
    async *call({
        command,
        timeout = 120000,
    }: {
        command: string;
        timeout?: number;
    }, _options: unknown, container?: Container) {
        const result = await bashTool({ container, command, timeout });
        yield {
            type: 'result',
            resultForAssistant: this.renderResultForAssistant(result),
            data: result,
        };
    },
};
