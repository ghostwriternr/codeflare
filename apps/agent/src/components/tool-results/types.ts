import type { ToolInvocation } from 'ai';

export type ToolResultInvocation = Extract<ToolInvocation, { state: 'result' }>;
