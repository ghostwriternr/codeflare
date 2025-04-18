import { getAbsolutePath } from '@/utils/file';
import { ripGrep } from '@/utils/ripgrep';
import { getCwd } from '@/utils/state';
import type { Output } from '@repo/common/types/grepTool';
import { stat } from 'fs/promises';
import { relative } from 'path';

export const grepTool = async (
    {
        pattern,
        path,
        include,
    }: { pattern: string; path?: string; include?: string },
    { abortController }: { abortController: AbortController }
) => {
    const start = Date.now();
    const absolutePath = getAbsolutePath(path) || getCwd();

    const args = ['-li', pattern];
    if (include) {
        args.push('--glob', include);
    }

    const results = await ripGrep(args, absolutePath, abortController.signal);

    const stats = await Promise.all(results.map((_) => stat(_)));
    const matches = results
        // Sort by modification time
        .map((_, i) => [_, stats[i]!] as const)
        .sort((a, b) => {
            if (process.env.NODE_ENV === 'test') {
                // In tests, we always want to sort by filename, so that results are deterministic
                return a[0].localeCompare(b[0]);
            }
            const timeComparison = (b[1].mtimeMs ?? 0) - (a[1].mtimeMs ?? 0);
            if (timeComparison === 0) {
                // Sort by filename as a tiebreaker
                return a[0].localeCompare(b[0]);
            }
            return timeComparison;
        })
        .map((_) => _[0]);

    const output = {
        filenames: matches,
        durationMs: Date.now() - start,
        numFiles: matches.length,
        relativeFileNames: matches.map((_) => relative(getCwd(), _)),
    } as Output;

    return output;
};
