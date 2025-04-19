import { logger } from '@/log';
import { execFile } from 'child_process';
import debug from 'debug';
import { memoize } from 'lodash-es';
import * as path from 'path';
import { findActualExecutable } from 'spawn-rx';

const d = debug('claude:ripgrep');

const useBuiltinRipgrep = !!process.env.USE_BUILTIN_RIPGREP;
if (useBuiltinRipgrep) {
    d('Using builtin ripgrep because USE_BUILTIN_RIPGREP is set');
}

const ripgrepPath = memoize(() => {
    const { cmd } = findActualExecutable('rg', []);
    d(`ripgrep initially resolved as: ${cmd}`);

    if (cmd !== 'rg' && !useBuiltinRipgrep) {
        // NB: If we're able to find ripgrep in $PATH, cmd will be an absolute
        // path rather than just returning 'rg'
        return cmd;
    } else {
        // TODO(@ghostwriternr): If the docker setup is done well, this is not needed
        // for production. Might be handy to do so for development, but I'd rather
        // just mention it as a dependency. In that case, just remove this block
        // after testing.

        // Use the one we ship in-box
        const rgRoot = path.resolve(__dirname, 'vendor', 'ripgrep');
        if (process.platform === 'win32') {
            // NB: Ripgrep doesn't ship an aarch64 binary for Windows, boooooo
            return path.resolve(rgRoot, 'x64-win32', 'rg.exe');
        }

        const ret = path.resolve(
            rgRoot,
            `${process.arch}-${process.platform}`,
            'rg'
        );

        d('internal ripgrep resolved as: %s', ret);
        return ret;
    }
});

export async function ripGrep(
    args: string[],
    target: string,
    abortSignal: AbortSignal
): Promise<string[]> {
    const rg = ripgrepPath();
    d('ripgrep called: %s %o', rg, target, args);

    // NB: When running interactively, ripgrep does not require a path as its last
    // argument, but when run non-interactively, it will hang unless a path or file
    // pattern is provided
    return new Promise((resolve) => {
        execFile(
            ripgrepPath(),
            [...args, target],
            {
                maxBuffer: 1_000_000,
                signal: abortSignal,
                timeout: 10_000,
            },
            (error, stdout) => {
                if (error) {
                    // Exit code 1 from ripgrep means "no matches found" - this is normal
                    if (error.code !== 1) {
                        console.error('ripgrep error: %o', error);
                        console.log(error);
                    }
                    resolve([]);
                } else {
                    d('ripgrep succeeded with %s', stdout);
                    resolve(stdout.trim().split('\n').filter(Boolean));
                }
            }
        );
    });
}

// NB: We do something tricky here. We know that ripgrep processes common
// ignore files for us, so we just ripgrep for any character, which matches
// all non-empty files
export async function listAllContentFiles(
    path: string,
    abortSignal: AbortSignal,
    limit: number
): Promise<string[]> {
    try {
        d('listAllContentFiles called: %s', path);
        return (await ripGrep(['-l', '.', path], path, abortSignal)).slice(
            0,
            limit
        );
    } catch (e) {
        d('listAllContentFiles failed: %o', e);

        logger.error(e);
        return [];
    }
}
