import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Input, Output } from '@repo/common/types/globTool';
import { z } from 'zod';

export const GlobToolResult = ({
    args,
    result,
}: {
    args: z.infer<Input>;
    result: Output;
}) => {
    const { numFiles, truncated } = result;

    return (
        <Card className="w-full p-4 space-y-2 gap-2">
            <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                    <span className="text-muted-foreground">Pattern</span>
                    <Badge variant="secondary">{args.pattern}</Badge>
                    {args.path && (
                        <>
                            <span className="text-muted-foreground">in</span>
                            <Badge variant="secondary">{args.path}</Badge>
                        </>
                    )}
                </div>
                <div className="flex gap-2 items-center">
                    <span className="text-muted-foreground">Found</span>
                    <Badge variant="outline">
                        {numFiles} {numFiles === 1 ? 'file' : 'files'}
                    </Badge>
                    {truncated && (
                        <span className="text-sm text-muted-foreground">
                            (Results truncated)
                        </span>
                    )}
                </div>
            </div>
        </Card>
    );
};
