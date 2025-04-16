import {
    detectFileEncoding,
    detectLineEndings,
    writeTextContent,
} from '@/utils/file';
import { PROJECT_FILE } from '@repo/common/constants/product';
import { getCwd } from '@repo/common/constants/state';
import { logEvent } from '@repo/common/utils/log';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, isAbsolute, resolve, sep } from 'path';
import { applyEdit } from './utils';

export const fileEditTool = (
    {
        file_path,
        old_string,
        new_string,
    }: { file_path: string; old_string: string; new_string: string }
    // { readFileTimestamps }: { readFileTimestamps: Record<string, number> }
) => {
    const { patch, updatedFile } = applyEdit(file_path, old_string, new_string);

    const fullFilePath = isAbsolute(file_path)
        ? file_path
        : resolve(getCwd(), file_path);
    const dir = dirname(fullFilePath);
    mkdirSync(dir, { recursive: true });
    const enc = existsSync(fullFilePath)
        ? detectFileEncoding(fullFilePath)
        : 'utf8';
    const endings = existsSync(fullFilePath)
        ? detectLineEndings(fullFilePath)
        : 'LF';
    const originalFile = existsSync(fullFilePath)
        ? readFileSync(fullFilePath, enc)
        : '';
    writeTextContent(fullFilePath, updatedFile, enc, endings);

    // TODO(@ghostwriternr): Really think about where the readFileTimestamps come in
    // Update read timestamp, to invalidate stale writes
    // readFileTimestamps[fullFilePath] = statSync(fullFilePath).mtimeMs;

    // Log when editing CLAUDE.md
    if (fullFilePath.endsWith(`${sep}${PROJECT_FILE}`)) {
        logEvent('tengu_write_claudemd', {});
    }

    const data = {
        filePath: file_path,
        oldString: old_string,
        newString: new_string,
        originalFile,
        structuredPatch: patch,
    };
    return data;
};
