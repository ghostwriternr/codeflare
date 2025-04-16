import type { ToolInvocation } from '@ai-sdk/ui-utils';
import type { Output } from '@repo/common/types/bashTool';
import Terminal from '@/components/ui/terminal';

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

export const BashToolResult = ({ invocation }: { invocation: ToolInvocation }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = invocation as unknown as any;
    const response = result[0].data;
    const { stdout, stdoutLines, stderr, stderrLines } = response as Output;

    const commands = [];
    
    if (stdout) {
        commands.push({
            command: '',
            output: renderTruncatedContent(stdout, stdoutLines)
        });
    }
    
    if (stderr) {
        commands.push({
            command: '',
            output: renderTruncatedContent(stderr, stderrLines),
            isError: true
        });
    }

    if (commands.length === 0) {
        commands.push({
            command: 'No output',
            output: '(No content)'
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
