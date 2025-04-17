import type { ToolInvocation } from '@ai-sdk/ui-utils';
import type { Input } from '@repo/common/types/bashTool';
import type { z } from 'zod';

export const ToolCall = ({ invocation }: { invocation: ToolInvocation }) => {
    const { toolName } = invocation;

    return toolName === 'Bash' ? <BashToolCall args={invocation.args} /> : null;
};

export const BashToolCall = ({ args }: { args: z.infer<Input> }) => {
    const command = args.command;

    // Clean up any command that uses the quoted HEREDOC pattern
    if (command.includes("\"$(cat <<'EOF'")) {
        const match = command.match(
            /^(.*?)"?\$\(cat <<'EOF'\n([\s\S]*?)\n\s*EOF\n\s*\)"(.*)$/
        );
        if (match && match[1] && match[2]) {
            const prefix = match[1];
            const content = match[2];
            const suffix = match[3] || '';
            return <div>{`${prefix.trim()} "${content.trim()}"${suffix.trim()}`}</div>;
        }
    }
    return <div>{command}</div>;
};
