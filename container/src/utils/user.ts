import { memoize } from 'lodash-es';
import { logError } from '../../../worker/utils/log.js';
import { execFileNoThrow } from './execFileNoThrow.js';

export const getGitEmail = memoize(async (): Promise<string | undefined> => {
    const result = await execFileNoThrow('git', ['config', 'user.email']);
    if (result.code !== 0) {
        logError(`Failed to get git email: ${result.stdout} ${result.stderr}`);
        return undefined;
    }
    return result.stdout.trim() || undefined;
});
