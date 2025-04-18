import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Input, Output } from '@repo/common/types/grepTool';
import { z } from 'zod';

export const GrepToolResult = ({
    result,
    args,
}: {
    result: Output;
    args: z.infer<Input>;
}) => {
    const { numFiles } = result;

    return (
        <Card className="w-full p-4 space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                    <span className="text-muted-foreground">
                        Searching for{' '}
                    </span>
                    <Badge variant="secondary">{args.pattern}</Badge>
                    {args.path && (
                        <>
                            <span className="text-muted-foreground">in</span>
                            <Badge variant="secondary">{args.path}</Badge>
                        </>
                    )}
                    {args.include && (
                        <>
                            <span className="text-muted-foreground">
                                matching
                            </span>
                            <Badge variant="secondary">{args.include}</Badge>
                        </>
                    )}
                </div>
                <div className="flex gap-2 items-center">
                    <span className="text-muted-foreground">Found</span>
                    <Badge variant="outline">
                        {numFiles} {numFiles === 1 ? 'file' : 'files'}
                    </Badge>
                </div>
            </div>
        </Card>
    );
};
