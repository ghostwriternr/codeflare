import Terminal from '@/components/ui/terminal';
import type { Input, Output } from '@repo/common/types/bashTool';
import type { z } from 'zod';

const MAX_RENDERED_LINES = 50;

function renderTruncatedContent(content: string, totalLines: number): string {
    const allLines = content.trim().split('\n');
    if (allLines.length <= MAX_RENDERED_LINES) {
        return allLines.join('\n');
    }
    const firstHalf = Math.floor(MAX_RENDERED_LINES / 2);
    const secondHalf = MAX_RENDERED_LINES - firstHalf;
    return [
        ...allLines.slice(0, firstHalf),
        `... (+${totalLines - MAX_RENDERED_LINES} lines hidden)`,
        ...allLines.slice(-secondHalf),
    ].join('\n');
}

export const BashToolResult = ({
    args,
    result,
}: {
    args: z.infer<Input>;
    result: Output;
}) => {
    const { stdout, stdoutLines, stderr, stderrLines } = result;
    const commands = [];

    if (stdout) {
        commands.push({
            command: args.command,
            output: renderTruncatedContent(stdout, stdoutLines),
        });
    }

    if (stderr) {
        commands.push({
            command: args.command,
            output: renderTruncatedContent(stderr, stderrLines),
            isError: true,
        });
    }

    if (commands.length === 0) {
        commands.push({
            command: 'No output',
            output: '(No content)',
        });
    }

    return (
        <Terminal
            username="bash"
            directory="~"
            commands={commands}
            height="400px"
            maxWidth="full"
        />
    );
};
