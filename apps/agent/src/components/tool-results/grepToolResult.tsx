import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Output } from '@repo/common/types/grepTool';

export const GrepToolResult = ({ result }: { result: Output }) => {
    const { numFiles, filenames } = result;

    return (
        <Card className="w-full p-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                    <span className="text-muted-foreground">Found</span>
                    <Badge variant="outline">
                        {numFiles} {numFiles === 1 ? 'file' : 'files'}
                    </Badge>
                </div>
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
