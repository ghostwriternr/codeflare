import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Input, Output } from '@repo/common/types/grepTool';
import { getRelativePath } from '@worker/bridge';
import { useEffect, useState } from 'react';
import { z } from 'zod';

export const GrepToolResult = ({
    result,
    args,
}: {
    result: Output;
    args: z.infer<Input>;
}) => {
    const { numFiles } = result;
    const [path, setPath] = useState(args.path);
    useEffect(() => {
        async function updateRelativePath() {
            if (args.path) {
                const relativePath = await getRelativePath(args.path);
                setPath(relativePath.path);
            }
        }
        updateRelativePath();
    }, [args.path]);

    return (
        <Card className="w-full p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-muted-foreground">
                            Searching for
                        </span>
                        <Badge variant="secondary" className="break-all">
                            {args.pattern}
                        </Badge>
                    </div>
                    {path && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-muted-foreground">in</span>
                            <Badge variant="secondary" className="break-all">
                                {path}
                            </Badge>
                        </div>
                    )}
                    {args.include && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-muted-foreground">
                                matching
                            </span>
                            <Badge variant="secondary" className="break-all">
                                {args.include}
                            </Badge>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 items-center self-start">
                    <span className="text-muted-foreground">Found</span>
                    <Badge variant="outline">
                        {numFiles} {numFiles === 1 ? 'file' : 'files'}
                    </Badge>
                </div>
            </div>
        </Card>
    );
};
