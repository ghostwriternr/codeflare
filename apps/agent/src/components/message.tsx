import { cn } from '@/lib/utils';
import type { UIMessage } from 'ai';
import { cx } from 'class-variance-authority';
import { AnimatePresence, motion } from 'motion/react';
import { Markdown } from './markdown';
import { MessageReasoning } from './message-reasoning';
import { ToolCall } from './tool-call';
import { ToolResult } from './tool-result';

export const PreviewMessage = ({
    message,
    isLoading,
}: {
    message: UIMessage;
    isLoading: boolean;
}) => {
    return (
        <AnimatePresence>
            <motion.div
                data-testid={`message-${message.role}`}
                className="w-full mx-auto max-w-3xl px-4 group/message"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                data-role={message.role}
            >
                <div className="flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:w-fit">
                    {message.role === 'assistant' && (
                        <div className="size-[25px] flex items-center justify-center">
                            <div className="translate-y-px">
                                <img src="/codeflare.png" alt="Codeflare" />
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-x-4 w-full">
                        {message.parts?.map((part, index) => {
                            const { type } = part;
                            const key = `message-${message.id}-part-${index}`;

                            if (type === 'reasoning') {
                                return (
                                    <MessageReasoning
                                        key={key}
                                        isLoading={isLoading}
                                        reasoning={part.reasoning}
                                    />
                                );
                            }

                            if (type === 'text') {
                                return (
                                    <div
                                        key={key}
                                        className="flex flex-row gap-2 items-start"
                                    >
                                        <div
                                            data-testid="message-content"
                                            className={cn(
                                                'flex flex-col gap-4',
                                                {
                                                    'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                                                        message.role === 'user',
                                                }
                                            )}
                                        >
                                            <Markdown>{part.text}</Markdown>
                                        </div>
                                    </div>
                                );
                            }

                            if (type === 'tool-invocation') {
                                const { toolInvocation } = part;
                                const { toolName, toolCallId, state } =
                                    toolInvocation;

                                if (state === 'call') {
                                    return (
                                        <div
                                            key={toolCallId}
                                            className={cx({
                                                skeleton: ['View'].includes(
                                                    toolName
                                                ),
                                            })}
                                        >
                                            <ToolCall
                                                invocation={toolInvocation}
                                            />
                                        </div>
                                    );
                                }

                                if (state === 'result') {
                                    return (
                                        <div key={toolCallId}>
                                            <ToolResult
                                                invocation={toolInvocation}
                                            />
                                        </div>
                                    );
                                }

                                return <></>;
                            }

                            return <></>;
                        })}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export const ThinkingMessage = () => {
    const role = 'assistant';

    return (
        <motion.div
            data-testid="message-assistant-loading"
            className="w-full mx-auto max-w-3xl px-4 group/message "
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
            data-role={role}
        >
            <div
                className={cx(
                    'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
                    {
                        'group-data-[role=user]/message:bg-muted': true,
                    }
                )}
            >
                <div className="size-[25px] flex items-center justify-center">
                    <img src="/codeflare.png" alt="Codeflare" />
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <div className="flex flex-col gap-4 text-muted-foreground">
                        Hmm...
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
