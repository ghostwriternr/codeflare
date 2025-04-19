import { logger } from '@/log';
import { memoize } from 'lodash-es';
import { execFileNoThrow } from './execFileNoThrow';

export const getGitEmail = memoize(async (): Promise<string | undefined> => {
    const result = await execFileNoThrow('git', ['config', 'user.email']);
    if (result.code !== 0) {
        logger.error(
            `Failed to get git email: ${result.stdout} ${result.stderr}`
        );
        return undefined;
    }
    return result.stdout.trim() || undefined;
});
