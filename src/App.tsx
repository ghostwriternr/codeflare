import { useState } from 'react';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { ArrowUpIcon } from './components/icons';

function App() {
    const [message, setMessage] = useState('');

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            const response = await fetch('/trigger', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: message }),
            });
            const data = await response.json();
            console.log('Response:', data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitForm(e);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 p-4 flex flex-col">
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    Codeflare
                </div>
            </main>

            <form
                onSubmit={submitForm}
                className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl"
            >
                <div className="relative w-full flex flex-col gap-4">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Send instruction"
                        className="min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700"
                    />
                    <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
                        <Button
                            type="submit"
                            className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
                        >
                            <ArrowUpIcon size={14} />
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default App;
