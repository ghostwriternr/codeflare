import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Output as WriteOutput } from '@repo/common/types/fileWriteTool';
import { FileEditToolResult } from './fileEditToolResult';

const MAX_LINES_TO_RENDER = 50;

export const FileWriteToolResult = ({ result }: { result: WriteOutput }) => {
    const { type, relativePath, content, structuredPatch } = result;

    if (type === 'update') {
        return (
            <FileEditToolResult
                relativePath={relativePath}
                structuredPatch={structuredPatch}
            />
        );
    }

    const contentWithFallback = content || '(No content)';
    const allLines = contentWithFallback.split('\n');
    const numLines = allLines.length;
    const truncatedContent = allLines
        .slice(0, MAX_LINES_TO_RENDER)
        .filter((line) => line.trim() !== '')
        .join('\n');

    return (
        <Card className="w-full p-4 space-y-2 gap-2">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <span className="text-muted-foreground">Wrote</span>
                    <span className="font-medium">{relativePath}</span>
                </div>
                <Badge variant="outline">
                    {numLines} {numLines === 1 ? 'line' : 'lines'}
                </Badge>
            </div>
            <ScrollArea className="w-full rounded-md border">
                <pre className={cn('p-4 text-sm font-mono', 'bg-muted')}>
                    {truncatedContent}
                </pre>
                {numLines > MAX_LINES_TO_RENDER && (
                    <div className="text-muted-foreground text-sm p-2 text-center border-t">
                        ... (+{numLines - MAX_LINES_TO_RENDER} lines)
                    </div>
                )}
            </ScrollArea>
        </Card>
    );
};
