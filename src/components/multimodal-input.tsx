import type { UseChatHelpers } from '@ai-sdk/react';
import { cx } from 'class-variance-authority';
import { ArrowUp, CircleStop } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

export function MultimodalInput({
    input,
    setInput,
    status,
    stop,
    handleSubmit,
    className,
}: {
    input: UseChatHelpers['input'];
    setInput: (input: string) => void;
    status: UseChatHelpers['status'];
    stop: () => void;
    handleSubmit: UseChatHelpers['handleSubmit'];
    className?: string;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { width } = useWindowSize();

    useEffect(() => {
        if (textareaRef.current) {
            adjustHeight();
        }
    }, []);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
        }
    };

    const resetHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = '98px';
        }
    };

    const [localStorageInput, setLocalStorageInput] = useLocalStorage(
        'input',
        ''
    );

    useEffect(() => {
        if (textareaRef.current) {
            const domValue = textareaRef.current.value;
            // Prefer DOM value over localStorage to handle hydration
            const finalValue = domValue || localStorageInput || '';
            setInput(finalValue);
            adjustHeight();
        }
        // Only run once after hydration
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setLocalStorageInput(input);
    }, [input, setLocalStorageInput]);

    const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(event.target.value);
        adjustHeight();
    };

    const submitForm = useCallback(() => {
        handleSubmit(undefined);

        setLocalStorageInput('');
        resetHeight();

        if (width && width > 768) {
            textareaRef.current?.focus();
        }
    }, [handleSubmit, setLocalStorageInput, width]);

    return (
        <div className="relative w-full flex flex-col gap-4">
            <Textarea
                data-testid="multimodal-input"
                ref={textareaRef}
                placeholder="Ask anything"
                value={input}
                onChange={handleInput}
                className={cx(
                    'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700',
                    className
                )}
                rows={2}
                autoFocus
                onKeyDown={(event) => {
                    if (
                        event.key === 'Enter' &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                    ) {
                        event.preventDefault();

                        if (status !== 'ready') {
                            toast.error(
                                'Please wait for the model to finish its response!'
                            );
                        } else {
                            submitForm();
                        }
                    }
                }}
            />

            <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
                {status === 'submitted' ? (
                    <StopButton stop={stop} />
                ) : (
                    <SendButton input={input} submitForm={submitForm} />
                )}
            </div>
        </div>
    );
}

const StopButton = ({ stop }: { stop: () => void }) => {
    return (
        <Button
            data-testid="stop-button"
            className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
            onClick={(event) => {
                event.preventDefault();
                stop();
            }}
        >
            <CircleStop size={14} />
        </Button>
    );
};

const SendButton = ({
    submitForm,
    input,
}: {
    submitForm: () => void;
    input: string;
}) => {
    return (
        <Button
            data-testid="send-button"
            className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
            onClick={(event) => {
                event.preventDefault();
                submitForm();
            }}
            disabled={input.length === 0}
        >
            <ArrowUp size={14} />
        </Button>
    );
};
