import type { UIMessage } from 'ai';
import type { UseChatHelpers } from 'ai/react';
import { Greeting } from './greeting';
import { PreviewMessage, ThinkingMessage } from './message';

interface MessagesProps {
    status: UseChatHelpers['status'];
    messages: Array<UIMessage>;
}

export const Messages = ({ status, messages }: MessagesProps) => {
    return (
        <div className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 scrollbar-thin">
            {messages.length === 0 && <Greeting />}

            {messages.map((message, index) => (
                <PreviewMessage
                    key={message.id}
                    message={message}
                    isLoading={
                        status === 'streaming' && messages.length - 1 === index
                    }
                />
            ))}

            {status === 'submitted' &&
                messages.length > 0 &&
                messages[messages.length - 1].role === 'user' && (
                    <ThinkingMessage />
                )}

            <div className="shrink-0 min-w-[24px] min-h-[24px]" />
        </div>
    );
};
