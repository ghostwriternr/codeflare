import { memoize } from 'lodash-es';
import * as path from 'path';
import { PROJECT_FILE } from './constants/product';
import { lastX } from './utils/generators';
import { getSlowAndCapableModel } from './utils/model';
import { ripGrep } from './utils/ripgrep';
import { getCodeStyle } from './utils/style';

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
            const model = await getSlowAndCapableModel();
            const resultsGen = LSTool.call(
                {
                    path: '.',
                },
                {
                    abortController,
                    options: {
                        commands: [],
                        tools: [],
                        slowAndCapableModel: model,
                        forkNumber: 0,
                        messageLogName: 'unused',
                        maxThinkingTokens: 0,
                    },
                    messageId: undefined,
                    readFileTimestamps: {},
                }
            );
            const result = await lastX(resultsGen);
            lines = result.data;
        } catch (error) {
            console.log(error);
            return '';
        }

        return `Below is a snapshot of this project's file structure at the start of the conversation. This snapshot will NOT update during the conversation.

${lines}`;
    }
);

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
