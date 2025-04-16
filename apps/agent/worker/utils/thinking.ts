import { getGlobalConfig, type ReasoningEffort } from '@repo/common/utils/config';
import { ThinkTool } from '@worker/tools/ThinkTool/ThinkTool';
import type { Message } from 'ai';
import { last } from 'lodash-es';

export async function getMaxThinkingTokens(
    messages: Message[]
): Promise<number> {
    if (await ThinkTool.isEnabled()) {
        return 0;
    }

    const lastMessage = last(messages);
    if (
        lastMessage?.role !== 'user' ||
        typeof lastMessage.content !== 'string'
    ) {
        return 0;
    }

    const content = lastMessage.content.toLowerCase();
    if (
        content.includes('think harder') ||
        content.includes('think intensely') ||
        content.includes('think longer') ||
        content.includes('think really hard') ||
        content.includes('think super hard') ||
        content.includes('think very hard') ||
        content.includes('ultrathink')
    ) {
        return 32_000 - 1;
    }

    if (
        content.includes('think about it') ||
        content.includes('think a lot') ||
        content.includes('think hard') ||
        content.includes('think more') ||
        content.includes('megathink')
    ) {
        return 10_000;
    }

    if (content.includes('think')) {
        return 4_000;
    }

    return 0;
}

export async function getReasoningEffort(
    modelType: 'large' | 'small',
    messages: Message[]
): Promise<ReasoningEffort | null> {
    const thinkingTokens = await getMaxThinkingTokens(messages);
    const config = getGlobalConfig();
    const _maxEffort: ReasoningEffort =
        modelType === 'large'
            ? config.largeModelReasoningEffort
            : config.smallModelReasoningEffort;
    const maxEffort =
        _maxEffort === 'high'
            ? 2
            : _maxEffort === 'medium'
              ? 1
              : _maxEffort === 'low'
                ? 0
                : null;
    if (!maxEffort) {
        return null;
    }

    let effort = 0;
    if (thinkingTokens < 10_000) {
        effort = 0;
    } else if (thinkingTokens >= 10_000 && thinkingTokens < 30_000) {
        effort = 1;
    } else {
        effort = 2;
    }

    if (effort > maxEffort) {
        return _maxEffort;
    }

    return effort === 2 ? 'high' : effort === 1 ? 'medium' : 'low';
}
