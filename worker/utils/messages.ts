import { NO_CONTENT_MESSAGE } from '../services/claude';

export const INTERRUPT_MESSAGE = '[Request interrupted by user]';
export const INTERRUPT_MESSAGE_FOR_TOOL_USE =
    '[Request interrupted by user for tool use]';
export const CANCEL_MESSAGE =
    "The user doesn't want to take this action right now. STOP what you are doing and wait for the user to tell you how to proceed.";

// Sometimes the API returns empty messages (eg. "\n\n"). We need to filter these out,
// otherwise they will give an API error when we send them to the API next time we call query().
export function normalizeContentFromAPI(
    content: APIMessage['content']
): APIMessage['content'] {
    const filteredContent = content.filter(
        (_) => _.type !== 'text' || _.text.trim().length > 0
    );

    if (filteredContent.length === 0) {
        return [{ type: 'text', text: NO_CONTENT_MESSAGE, citations: [] }];
    }

    return filteredContent;
}

export function getLastAssistantMessageId(
    messages: Message[]
): string | undefined {
    // Iterate from the end of the array to find the last assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message && message.type === 'assistant') {
            return message.message.id;
        }
    }
    return undefined;
}
