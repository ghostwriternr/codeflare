import { useAgentChat } from 'agents/ai-react';
import { useAgent } from 'agents/react';
import { useEffect, useState } from 'react';
import { ChatHeader } from './components/chat-header';
import { Messages } from './components/messages';
import { MultimodalInput } from './components/multimodal-input';

export default function Chat() {
    const [theme] = useState<'dark' | 'light'>(() => {
        // Check localStorage first, default to dark if not found
        const savedTheme = localStorage.getItem('theme');
        return (savedTheme as 'dark' | 'light') || 'dark';
    });

    useEffect(() => {
        // Apply theme class on mount and when theme changes
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }

        // Save theme preference to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    const agent = useAgent({
        agent: 'chat',
    });

    const {
        messages: agentMessages,
        input: agentInput,
        handleInputChange: handleAgentInputChange,
        handleSubmit: handleAgentSubmit,
        status,
        clearHistory,
    } = useAgentChat({
        agent,
        maxSteps: 5,
    });

    // TODO(@ghostwriternr): This is weird
    const setInput = (input: string) => {
        const syntheticEvent = {
            target: { value: input },
            currentTarget: { value: input },
        } as React.ChangeEvent<HTMLInputElement>;
        handleAgentInputChange(syntheticEvent);
    };

    return (
        <div className="flex flex-col min-w-0 h-dvh bg-background">
            <ChatHeader onClear={clearHistory} />
            <Messages status="ready" messages={agentMessages} />
            <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
                <MultimodalInput
                    input={agentInput}
                    setInput={setInput}
                    handleSubmit={handleAgentSubmit}
                    status={status}
                    stop={stop}
                />
            </form>
        </div>
    );
}
