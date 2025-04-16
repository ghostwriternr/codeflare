import type { ToolInvocation } from '@ai-sdk/ui-utils';

export const ToolCall = ({ invocation }: { invocation: ToolInvocation }) => {
    const { toolName } = invocation;

    return toolName === 'View' ? <></> : null;
};
