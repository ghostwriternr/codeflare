import { Markdown } from '@/components/markdown';
import type { Output } from '@repo/common/types/thinkTool';
import { Brain } from 'lucide-react';

export const ThinkToolResult = ({ result }: { result: Output }) => {
    return (
        <div className="relative p-4 my-2 rounded-lg bg-card border border-border">
            <div className="absolute -left-3 -top-3 w-6 h-6 bg-background rounded-full border border-border flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary" />
            </div>
            <div className="pl-2">
                <Markdown>{result.thought}</Markdown>
            </div>
        </div>
    );
};
