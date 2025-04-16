import { PlusIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export const ChatHeader = ({ onClear }: { onClear: () => void }) => {
    return (
        <header className="flex sticky top-0 bg-background py-1.5 items-center justify-between px-2 md:px-3 gap-2">
            <div className="order-1">
                <h1 className="text-lg font-bold">cloudflare/agents</h1>
            </div>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        className="order-2 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
                        onClick={onClear}
                    >
                        <PlusIcon />
                        <span className="md:sr-only">New Chat</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>New Chat</TooltipContent>
            </Tooltip>
        </header>
    );
};
