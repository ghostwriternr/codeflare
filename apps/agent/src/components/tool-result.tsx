import { BashToolResult } from './tool-results/bashToolResult';
import { FileEditToolResult } from './tool-results/fileEditToolResult';
import { FileReadToolResult } from './tool-results/fileReadToolResult';
import { FileWriteToolResult } from './tool-results/fileWriteToolResult';
import { GlobToolResult } from './tool-results/globToolResult';
import { GrepToolResult } from './tool-results/grepToolResult';
import { LSToolResult } from './tool-results/lsToolResult';
import { ThinkToolResult } from './tool-results/thinkToolResult';
import type { ToolResultInvocation } from './tool-results/types';

type ToolResultType = {
    invocation: ToolResultInvocation;
};

export const ToolResult = ({ invocation }: ToolResultType) => {
    const { toolName, args, result } = invocation;
    console.log('tool result', toolName, args, result);
    const data = result[0].data;

    return (
        <div className="py-2">
            {toolName === 'Bash' ? (
                <BashToolResult args={args} result={data} />
            ) : toolName === 'Edit' ? (
                <FileEditToolResult
                    relativePath={data.relativePath}
                    structuredPatch={data.structuredPatch}
                />
            ) : toolName === 'View' ? (
                <FileReadToolResult result={data} />
            ) : toolName === 'Replace' ? (
                <FileWriteToolResult result={data} />
            ) : toolName === 'GlobTool' ? (
                <GlobToolResult args={args} result={data} />
            ) : toolName === 'GrepTool' ? (
                <GrepToolResult args={args} result={data} />
            ) : toolName === 'LS' ? (
                <LSToolResult result={data} />
            ) : toolName === 'Think' ? (
                <ThinkToolResult result={data} />
            ) : null}
        </div>
    );
};
