import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { StructuredPatch } from '@repo/common/types/fileEditTool';

export const FileEditToolResult = ({
    filePath,
    structuredPatch,
}: {
    filePath: string;
    structuredPatch: StructuredPatch;
}) => {
    const numAdditions = structuredPatch.reduce((count) => count + 1, 0);

    return (
        <Card className="w-full p-4 space-y-2 gap-2">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">{filePath}</span>
                </div>
                {numAdditions > 0 && (
                    <Badge variant="outline" className="ml-2">
                        {numAdditions}{' '}
                        {numAdditions === 1 ? 'change' : 'changes'}
                    </Badge>
                )}
            </div>
            <ScrollArea className="w-full rounded-md border">
                <div className="p-4 space-y-4">
                    {structuredPatch.map((patch) => (
                        <div key={patch.newStart} className="font-mono text-sm">
                            <div className="text-muted-foreground">
                                @@ -{patch.oldStart},{patch.oldLines} +
                                {patch.newStart},{patch.newLines} @@
                            </div>
                            <pre className={cn('mt-2 space-y-1')}>
                                {patch.lines.map((line, i) => {
                                    const prefix = line[0];
                                    const content = line.slice(2);
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                'px-2 rounded',
                                                prefix === '+' &&
                                                    'bg-green-500/10 text-green-700 dark:text-green-400',
                                                prefix === '-' &&
                                                    'bg-red-500/10 text-red-700 dark:text-red-400'
                                            )}
                                        >
                                            {prefix} {content}
                                        </div>
                                    );
                                })}
                            </pre>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </Card>
    );
};
