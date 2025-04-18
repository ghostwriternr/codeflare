import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Output } from '@repo/common/types/globTool';

export const GlobToolResult = ({ result }: { result: Output }) => {
    const { numFiles, filenames, truncated } = result;

    return (
        <Card className="w-full p-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                    <span className="text-muted-foreground">Found</span>
                    <Badge variant="outline">
                        {numFiles} {numFiles === 1 ? 'file' : 'files'}
                    </Badge>
                </div>
                {truncated && (
                    <span className="text-sm text-muted-foreground">
                        Results truncated
                    </span>
                )}
            </div>
            {filenames.length > 0 && (
                <div className="mt-2 space-y-1 text-sm font-mono">
                    {filenames.map((filename, i) => (
                        <div key={i} className="text-muted-foreground">
                            {filename}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
