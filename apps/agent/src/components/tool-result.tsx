import { BashToolResult } from './tool-results/bashToolResult';
import type { ToolResultInvocation } from './tool-results/types';

type ToolResultType = {
    invocation: ToolResultInvocation;
};

export const ToolResult = ({ invocation }: ToolResultType) => {
    const { toolName } = invocation;
    console.log(invocation);
    return (
        <div className="pb-4">
            {toolName === 'Bash' ? (
                <BashToolResult
                    args={invocation.args}
                    result={invocation.result[0].data}
                />
            ) : null}
        </div>
    );
};
