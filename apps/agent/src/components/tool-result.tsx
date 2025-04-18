import { BashToolResult } from './tool-results/bashToolResult';
import { FileEditToolResult } from './tool-results/fileEditToolResult';
import { FileReadToolResult } from './tool-results/fileReadToolResult';
import { FileWriteToolResult } from './tool-results/fileWriteToolResult';
import { GlobToolResult } from './tool-results/globToolResult';
import { GrepToolResult } from './tool-results/grepToolResult';
import { LSToolResult } from './tool-results/lsToolResult';
import type { ToolResultInvocation } from './tool-results/types';

type ToolResultType = {
    invocation: ToolResultInvocation;
};

export const ToolResult = ({ invocation }: ToolResultType) => {
    const { toolName } = invocation;
    return (
        <div className="pb-4">
            {toolName === 'Bash' ? (
                <BashToolResult
                    args={invocation.args}
                    result={invocation.result[0].data}
                />
            ) : toolName === 'Edit' ? (
                <FileEditToolResult
                    filePath={invocation.result[0].data.filePath}
                    structuredPatch={invocation.result[0].data.structuredPatch}
                />
            ) : toolName === 'View' ? (
                <FileReadToolResult result={invocation.result[0].data} />
            ) : toolName === 'Replace' ? (
                <FileWriteToolResult result={invocation.result[0].data} />
            ) : toolName === 'GlobTool' ? (
                <GlobToolResult result={invocation.result[0].data} />
            ) : toolName === 'GrepTool' ? (
                <GrepToolResult result={invocation.result[0].data} />
            ) : toolName === 'LS' ? (
                <LSToolResult result={invocation.result[0].data} />
            ) : null}
        </div>
    );
};
