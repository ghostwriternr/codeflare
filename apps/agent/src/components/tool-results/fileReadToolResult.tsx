import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Output } from '@repo/common/types/fileReadTool';

const MAX_LINES_TO_RENDER = 5;

export const FileReadToolResult = ({ result }: { result: Output }) => {
    if (result.type === 'image') {
        return (
            <Card className="w-full p-4">
                <img
                    src={`data:${result.source.media_type};base64,${result.source.data}`}
                    alt="File content"
                    className="max-w-full h-auto"
                />
            </Card>
        );
    }

    const { relativePath, content, numLines, totalLines } = result.file;
    const contentWithFallback = content || '(No content)';
    const truncatedContent = contentWithFallback
        .split('\n')
        .slice(0, MAX_LINES_TO_RENDER)
        .filter((_) => _.trim() !== '')
        .join('\n');

    return (
        <Card className="w-full p-4 space-y-2 gap-2">
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Reading</span>
                <span className="font-medium">{relativePath}</span>
            </div>
            <ScrollArea className="w-full rounded-md border">
                <pre className={cn('p-4 text-sm font-mono', 'bg-muted')}>
                    {truncatedContent}
                </pre>
                {numLines > MAX_LINES_TO_RENDER && (
                    <div className="text-muted-foreground text-sm p-2 border-t">
                        ... (+{totalLines - MAX_LINES_TO_RENDER} lines)
                    </div>
                )}
            </ScrollArea>
        </Card>
    );
};
