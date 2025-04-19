import { getCwd } from '@/utils/state';
import { closeSync, openSync, readFileSync, readSync, writeFileSync } from 'fs';
import { glob as globLib } from 'glob';
import { LRUCache } from 'lru-cache';
import {
    isAbsolute,
    normalize,
    resolve,
    resolve as resolvePath,
    sep,
} from 'path';
import { cwd } from 'process';
import { listAllContentFiles } from './ripgrep';
import { logger } from '@/log';

export type LineEndingType = 'CRLF' | 'LF';

export async function glob(
    filePattern: string,
    cwd: string,
    { limit, offset }: { limit: number; offset: number },
    abortSignal: AbortSignal
): Promise<{ files: string[]; truncated: boolean }> {
    // TODO: Use worker threads
    const paths = await globLib([filePattern], {
        cwd,
        nocase: true,
        nodir: true,
        signal: abortSignal,
        stat: true,
        withFileTypes: true,
    });
    const sortedPaths = paths.sort(
        (a, b) => (a.mtimeMs ?? 0) - (b.mtimeMs ?? 0)
    );
    const truncated = sortedPaths.length > offset + limit;
    return {
        files: sortedPaths
            .slice(offset, offset + limit)
            .map((path) => path.fullpath()),
        truncated,
    };
}

export function isInDirectory(
    relativePath: string,
    relativeCwd: string
): boolean {
    if (relativePath === '.') {
        return true;
    }

    // Reject paths starting with ~ (home directory)
    if (relativePath.startsWith('~')) {
        return false;
    }

    // Reject paths containing null bytes or other sneaky characters
    if (relativePath.includes('\0') || relativeCwd.includes('\0')) {
        return false;
    }

    // Normalize paths to resolve any '..' or '.' segments
    // and add trailing slashes
    let normalizedPath = normalize(relativePath);
    let normalizedCwd = normalize(relativeCwd);

    normalizedPath = normalizedPath.endsWith(sep)
        ? normalizedPath
        : normalizedPath + sep;
    normalizedCwd = normalizedCwd.endsWith(sep)
        ? normalizedCwd
        : normalizedCwd + sep;

    // Join with a base directory to make them absolute-like for comparison
    // Using 'dummy' as base to avoid any actual file system dependencies
    const fullPath = resolvePath(cwd(), normalizedCwd, normalizedPath);
    const fullCwd = resolvePath(cwd(), normalizedCwd);

    // Check if the path starts with the cwd
    return fullPath.startsWith(fullCwd);
}

export function readTextContent(
    filePath: string,
    offset = 0,
    maxLines?: number
): { content: string; lineCount: number; totalLines: number } {
    const enc = detectFileEncoding(filePath);
    const content = readFileSync(filePath, enc);
    const lines = content.split(/\r?\n/);

    // Truncate number of lines if needed
    const toReturn =
        maxLines !== undefined && lines.length - offset > maxLines
            ? lines.slice(offset, offset + maxLines)
            : lines.slice(offset);

    return {
        content: toReturn.join('\n'), // TODO: This probably won't work for Windows
        lineCount: toReturn.length,
        totalLines: lines.length,
    };
}

export function writeTextContent(
    filePath: string,
    content: string,
    encoding: BufferEncoding,
    endings: LineEndingType
): void {
    let toWrite = content;
    if (endings === 'CRLF') {
        toWrite = content.split('\n').join('\r\n');
    }

    writeFileSync(filePath, toWrite, { encoding, flush: true });
}

const repoEndingCache = new LRUCache<string, LineEndingType>({
    fetchMethod: (path) => detectRepoLineEndingsDirect(path),
    ttl: 5 * 60 * 1000,
    ttlAutopurge: false,
    max: 1000,
});

export async function detectRepoLineEndings(
    filePath: string
): Promise<LineEndingType | undefined> {
    return repoEndingCache.fetch(resolve(filePath));
}

export async function detectRepoLineEndingsDirect(
    cwd: string
): Promise<LineEndingType> {
    const abortController = new AbortController();
    setTimeout(() => {
        abortController.abort();
    }, 1_000);
    const allFiles = await listAllContentFiles(cwd, abortController.signal, 15);

    let crlfCount = 0;
    for (const file of allFiles) {
        const lineEnding = detectLineEndings(file);
        if (lineEnding === 'CRLF') {
            crlfCount++;
        }
    }

    return crlfCount > 3 ? 'CRLF' : 'LF';
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function fetch<K extends {}, V extends {}>(
    cache: LRUCache<K, V>,
    key: K,
    value: () => V
): V {
    if (cache.has(key)) {
        return cache.get(key)!;
    }

    const v = value();
    cache.set(key, v);
    return v;
}

// TODO(@ghostwriternr): What is the lifecycle of a cache in a worker/container world?
const fileEncodingCache = new LRUCache<string, BufferEncoding>({
    fetchMethod: (path) => detectFileEncodingDirect(path),
    ttl: 5 * 60 * 1000,
    ttlAutopurge: false,
    max: 1000,
});

export function detectFileEncoding(filePath: string): BufferEncoding {
    const k = resolve(filePath);
    return fetch(fileEncodingCache, k, () => detectFileEncodingDirect(k));
}

export function detectFileEncodingDirect(filePath: string): BufferEncoding {
    const BUFFER_SIZE = 4096;
    const buffer = Buffer.alloc(BUFFER_SIZE);

    let fd: number | undefined = undefined;
    try {
        fd = openSync(filePath, 'r');
        const bytesRead = readSync(fd, buffer, 0, BUFFER_SIZE, 0);

        if (bytesRead >= 2) {
            if (buffer[0] === 0xff && buffer[1] === 0xfe) return 'utf16le';
        }

        if (
            bytesRead >= 3 &&
            buffer[0] === 0xef &&
            buffer[1] === 0xbb &&
            buffer[2] === 0xbf
        ) {
            return 'utf8';
        }

        const isUtf8 = buffer.slice(0, bytesRead).toString('utf8').length > 0;
        return isUtf8 ? 'utf8' : 'ascii';
    } catch (error) {
        logger.error(`Error detecting encoding for file ${filePath}: ${error}`);
        return 'utf8';
    } finally {
        if (fd) closeSync(fd);
    }
}

// TODO(@ghostwriternr): What is the lifecycle of a cache in a worker/container world?
const lineEndingCache = new LRUCache<string, LineEndingType>({
    fetchMethod: (path) => detectLineEndingsDirect(path),
    ttl: 5 * 60 * 1000,
    ttlAutopurge: false,
    max: 1000,
});

export function detectLineEndings(filePath: string): LineEndingType {
    const k = resolve(filePath);
    return fetch(lineEndingCache, k, () => detectLineEndingsDirect(k));
}

export function detectLineEndingsDirect(
    filePath: string,
    encoding: BufferEncoding = 'utf8'
): LineEndingType {
    try {
        const buffer = Buffer.alloc(4096);
        const fd = openSync(filePath, 'r');
        const bytesRead = readSync(fd, buffer, 0, 4096, 0);
        closeSync(fd);

        const content = buffer.toString(encoding, 0, bytesRead);
        let crlfCount = 0;
        let lfCount = 0;

        for (let i = 0; i < content.length; i++) {
            if (content[i] === '\n') {
                if (i > 0 && content[i - 1] === '\r') {
                    crlfCount++;
                } else {
                    lfCount++;
                }
            }
        }

        return crlfCount > lfCount ? 'CRLF' : 'LF';
    } catch (error) {
        logger.error(
            `Error detecting line endings for file ${filePath}: ${error}`
        );
        return 'LF';
    }
}

export function normalizeFilePath(filePath: string): string {
    const absoluteFilePath = isAbsolute(filePath)
        ? filePath
        : resolve(getCwd(), filePath);

    // One weird trick for half-width space characters in MacOS screenshot filenames
    if (absoluteFilePath.endsWith(' AM.png')) {
        return absoluteFilePath.replace(
            ' AM.png',
            `${String.fromCharCode(8239)}AM.png`
        );
    }

    // One weird trick for half-width space characters in MacOS screenshot filenames
    if (absoluteFilePath.endsWith(' PM.png')) {
        return absoluteFilePath.replace(
            ' PM.png',
            `${String.fromCharCode(8239)}PM.png`
        );
    }

    return absoluteFilePath;
}

export function getAbsolutePath(path: string | undefined): string | undefined {
    return path
        ? isAbsolute(path)
            ? path
            : resolve(getCwd(), path)
        : undefined;
}
