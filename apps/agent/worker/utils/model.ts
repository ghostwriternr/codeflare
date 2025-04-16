import { getGlobalConfig } from '@repo/common/utils/config';
import { memoize } from 'lodash-es';

export const getSlowAndCapableModel = memoize(async (): Promise<string> => {
    const config = await getGlobalConfig();
    return config.smallModelName;
});
