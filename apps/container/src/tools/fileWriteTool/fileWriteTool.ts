import { getPatch } from '@/utils/diff';
import {
    detectFileEncoding,
    detectLineEndings,
    detectRepoLineEndings,
    writeTextContent,
} from '@/utils/file';
import { getCwd } from '@/utils/state';
import type { Output } from '@repo/common/types/fileWriteTool';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, isAbsolute, relative, resolve } from 'path';

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
            relativePath: relative(getCwd(), file_path),
            content,
            structuredPatch: patch,
        } as Output;
        return data;
    }

    const data = {
        type: 'create' as const,
        filePath: file_path,
        relativePath: relative(getCwd(), file_path),
        content,
        structuredPatch: [],
    } as Output;

    return data;
};
