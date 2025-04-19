import { PROJECT_FILE } from '@repo/common/constants/product';
import { getCurrentProjectConfig } from '@repo/common/utils/config';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { memoize } from 'lodash-es';
import * as path from 'path';
import { logger } from './log';
import { lsTool } from './tools/lsTool/lsTool';
import { execFileNoThrow } from './utils/execFileNoThrow';
import { getIsGit } from './utils/git';
import { ripGrep } from './utils/ripgrep';
import { getCwd } from './utils/state';
import { getCodeStyle } from './utils/style';
import { getGitEmail } from './utils/user';

/**
 * Find all CLAUDE.md files in the current working directory
 */
export async function getClaudeFiles(): Promise<string | null> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 3000);
    try {
        const files = await ripGrep(
            ['--files', '--glob', path.join('**', '*', PROJECT_FILE)],
            getCwd(),
            abortController.signal
        );
        if (!files.length) {
            return null;
        }

        // Add instructions for additional KODING.md files
        return `NOTE: Additional ${PROJECT_FILE} files were found. When working in these directories, make sure to read and follow the instructions in the corresponding ${PROJECT_FILE} file:\n${files
            .map((_) => path.join(getCwd(), _))
            .map((_) => `- ${_}`)
            .join('\n')}`;
    } catch (error) {
        console.log(error);
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Approximate directory structure, to orient Claude. Claude will start with this, then use
 * tools like LS and View to get more information.
 */
export const getDirectoryStructure = memoize(
    async function (): Promise<string> {
        let lines: string;
        try {
            const abortController = new AbortController();
            setTimeout(() => {
                abortController.abort();
            }, 1_000);
            const results = lsTool('.', abortController);
            lines = results.user;
        } catch (error) {
            console.log(error);
            return '';
        }

        return `Below is a snapshot of this project's file structure at the start of the conversation. This snapshot will NOT update during the conversation.

${lines}`;
    }
);

export const getReadme = memoize(async (): Promise<string | null> => {
    try {
        const readmePath = path.join(getCwd(), 'README.md');
        if (!existsSync(readmePath)) {
            return null;
        }
        const content = await readFile(readmePath, 'utf-8');
        return content;
    } catch (e) {
        logger.error(e);
        return null;
    }
});

export const getGitStatus = memoize(async (): Promise<string | null> => {
    if (process.env.NODE_ENV === 'test') {
        // Avoid cycles in tests
        return null;
    }
    if (!(await getIsGit())) {
        return null;
    }

    try {
        const [branch, mainBranch, status, log, authorLog] = await Promise.all([
            execFileNoThrow(
                'git',
                ['branch', '--show-current'],
                undefined,
                undefined,
                false
            ).then(({ stdout }) => stdout.trim()),
            execFileNoThrow(
                'git',
                ['rev-parse', '--abbrev-ref', 'origin/HEAD'],
                undefined,
                undefined,
                false
            ).then(({ stdout }) => stdout.replace('origin/', '').trim()),
            execFileNoThrow(
                'git',
                ['status', '--short'],
                undefined,
                undefined,
                false
            ).then(({ stdout }) => stdout.trim()),
            execFileNoThrow(
                'git',
                ['log', '--oneline', '-n', '5'],
                undefined,
                undefined,
                false
            ).then(({ stdout }) => stdout.trim()),
            execFileNoThrow(
                'git',
                [
                    'log',
                    '--oneline',
                    '-n',
                    '5',
                    '--author',
                    (await getGitEmail()) || '',
                ],
                undefined,
                undefined,
                false
            ).then(({ stdout }) => stdout.trim()),
        ]);
        // Check if status has more than 200 lines
        const statusLines = status.split('\n').length;
        const truncatedStatus =
            statusLines > 200
                ? status.split('\n').slice(0, 200).join('\n') +
                  '\n... (truncated because there are more than 200 lines. If you need more information, run "git status" using BashTool)'
                : status;

        return `This is the git status at the start of the conversation. Note that this status is a snapshot in time, and will not update during the conversation.\nCurrent branch: ${branch}\n\nMain branch (you will usually use this for PRs): ${mainBranch}\n\nStatus:\n${truncatedStatus || '(clean)'}\n\nRecent commits:\n${log}\n\nYour recent commits:\n${authorLog || '(no recent commits)'}`;
    } catch (error) {
        logError(error);
        return null;
    }
});

/**
 * This context is prepended to each conversation, and cached for the duration of the conversation.
 */
export const getContext = memoize(
    async (): Promise<{
        [k: string]: string;
    }> => {
        const codeStyle = getCodeStyle();
        const projectConfig = getCurrentProjectConfig();
        const dontCrawl = projectConfig.dontCrawlDirectory;
        const [gitStatus, directoryStructure, claudeFiles, readme] =
            await Promise.all([
                getGitStatus(),
                dontCrawl ? Promise.resolve('') : getDirectoryStructure(),
                dontCrawl ? Promise.resolve('') : getClaudeFiles(),
                getReadme(),
            ]);
        return {
            ...projectConfig.context,
            ...(directoryStructure ? { directoryStructure } : {}),
            ...(gitStatus ? { gitStatus } : {}),
            ...(codeStyle ? { codeStyle } : {}),
            ...(claudeFiles ? { claudeFiles } : {}),
            ...(readme ? { readme } : {}),
        };
    }
);
