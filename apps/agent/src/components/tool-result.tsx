import type { ToolInvocation } from '@ai-sdk/ui-utils';
import { BashToolResult } from './tool-results/bashToolResult';

export const ToolResult = ({ invocation }: { invocation: ToolInvocation }) => {
    console.log(invocation);
    const { toolName } = invocation;
    return <div className='pb-4'>{toolName === 'Bash' ? <BashToolResult invocation={invocation} /> : null}</div>;
};
