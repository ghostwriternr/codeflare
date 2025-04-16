import { memoize } from 'lodash-es';
import { getGlobalConfig } from './config';

export const getSlowAndCapableModel = memoize(async (): Promise<string> => {
    const config = await getGlobalConfig();
    return config.smallModelName;
});
