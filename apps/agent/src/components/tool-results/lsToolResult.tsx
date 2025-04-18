import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Output } from '@repo/common/types/lsTool';

const MAX_LINES = 20;
const TRUNCATED_MESSAGE = 'NOTE: This listing has been truncated.';

export const LSToolResult = ({ result }: { result: Output }) => {
    const lines = result.user
        .replace(TRUNCATED_MESSAGE, '')
        .split('\n')
        .filter((line) => line.trim() !== '');

    if (lines.length === 0) {
        return null;
    }

    const truncated = lines.length > MAX_LINES;
    const displayLines = truncated ? lines.slice(0, MAX_LINES) : lines;

    return (
        <Card className="w-full p-4 space-y-2 gap-2">
            <ScrollArea className="w-full">
                <div className="space-y-1 text-sm font-mono">
                    {displayLines.map((line, i) => (
                        <div
                            key={i}
                            className="text-muted-foreground whitespace-pre"
                        >
                            {line}
                        </div>
                    ))}
                    {truncated && (
                        <div className="text-muted-foreground text-sm mt-2 border-t pt-2">
                            ... (+{lines.length - MAX_LINES} items)
                        </div>
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
};
