import { ReasoningEffort } from './thinking';

type GlobalConfig = {
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
