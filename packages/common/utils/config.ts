export type ReasoningEffort = 'low' | 'medium' | 'high';

export type GlobalConfig = {
    largeModelName: string;
    smallModelName: string;
    largeModelReasoningEffort: ReasoningEffort;
    smallModelReasoningEffort: ReasoningEffort;
    largeModelMaxTokens: number;
    smallModelMaxTokens: number;
    maxTokens: number;
};

export const getGlobalConfig = (): GlobalConfig => {
    return {
        largeModelName: 'claude-3-7-sonnet-latest',
        smallModelName: 'claude-3-5-haiku-latest',
        largeModelReasoningEffort: 'medium',
        smallModelReasoningEffort: 'medium',
        largeModelMaxTokens: 20_000,
        smallModelMaxTokens: 8192,
        maxTokens: 8192,
    };
};

export type ProjectConfig = {
    allowedTools: string[];
    context: Record<string, string>;
    contextFiles?: string[];
    history: string[];
    dontCrawlDirectory?: boolean;
    enableArchitectTool?: boolean;
    mcpContextUris: string[];
    // mcpServers?: Record<string, McpServerConfig>;
    approvedMcprcServers?: string[];
    rejectedMcprcServers?: string[];
    lastAPIDuration?: number;
    lastCost?: number;
    lastDuration?: number;
    lastSessionId?: string;
    exampleFiles?: string[];
    exampleFilesGeneratedAt?: number;
    hasTrustDialogAccepted?: boolean;
    hasCompletedProjectOnboarding?: boolean;
};

export function getCurrentProjectConfig(): ProjectConfig {
    return {
        allowedTools: [],
        context: {},
        history: [],
        mcpContextUris: [],
    };
}
