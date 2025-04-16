import { getCwd } from '@repo/common/constants/state';
import type { Output } from '@repo/common/types/globTool';
import { glob } from '@/utils/file';

export const globTool = async (
    {
        pattern,
        path,
    }: {
        pattern: string;
        path?: string;
    },
    { abortController }: { abortController: AbortController }
) => {
    const start = Date.now();
    const { files, truncated } = await glob(
        pattern,
        path ?? getCwd(),
        { limit: 100, offset: 0 },
        abortController.signal
    );
    const output: Output = {
        filenames: files,
        durationMs: Date.now() - start,
        numFiles: files.length,
        truncated,
    };
    return output;
};
