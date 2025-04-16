import { existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, isAbsolute, resolve, sep } from 'path';
import { PROJECT_FILE } from '@repo/common/constants/product';
import { getPatch } from '../../../../worker/utils/diff';
import { logEvent } from '@repo/common/utils/log';
import { getCwd } from '../../../../worker/utils/state';
import {
    detectFileEncoding,
    detectLineEndings,
    detectRepoLineEndings,
    writeTextContent,
} from '../../utils/file';

export const fileWriteTool = async ({
    file_path,
    content,
}: {
    file_path: string;
    content: string;
}) => {
    const fullFilePath = isAbsolute(file_path)
        ? file_path
        : resolve(getCwd(), file_path);
    const dir = dirname(fullFilePath);
    const oldFileExists = existsSync(fullFilePath);
    const enc = oldFileExists ? detectFileEncoding(fullFilePath) : 'utf-8';
    const oldContent = oldFileExists ? readFileSync(fullFilePath, enc) : null;

    const endings = oldFileExists
        ? detectLineEndings(fullFilePath)
        : await detectRepoLineEndings(getCwd());

    mkdirSync(dir, { recursive: true });
    writeTextContent(fullFilePath, content, enc, endings!);

    // TODO(@ghostwriternr): Figure this out
    // Update read timestamp, to invalidate stale writes
    // readFileTimestamps[fullFilePath] = statSync(fullFilePath).mtimeMs;

    // Log when writing to CLAUDE.md
    if (fullFilePath.endsWith(`${sep}${PROJECT_FILE}`)) {
        logEvent('tengu_write_claudemd', {});
    }

    if (oldContent) {
        const patch = getPatch({
            filePath: file_path,
            fileContents: oldContent,
            oldStr: oldContent,
            newStr: content,
        });

        const data = {
            type: 'update' as const,
            filePath: file_path,
            content,
            structuredPatch: patch,
        };
        return data;
    }

    const data = {
        type: 'create' as const,
        filePath: file_path,
        content,
        structuredPatch: [],
    };

    return data;
};
