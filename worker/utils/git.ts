import { memoize } from 'lodash-es';

// TODO(@ghostwriternr): Welp, time to go crazy.
export const getIsGit = memoize(async (): Promise<boolean> => {
    const { code } = await execFileNoThrow('git', [
        'rev-parse',
        '--is-inside-work-tree',
    ]);
    return code === 0;
});
