import path from 'path';
import { normalizeFilePath, readTextContent } from '../../utils/file';

export const fileReadTool = (
    {
        file_path,
        offset = 1,
        limit = undefined,
    }: { file_path: string; offset?: number; limit?: number },
    { readFileTimestamps }: { readFileTimestamps: Record<string, number> }
) => {
    const ext = path.extname(file_path).toLowerCase();
    const fullFilePath = normalizeFilePath(file_path);

    // Update read timestamp, to invalidate stale writes
    readFileTimestamps[fullFilePath] = Date.now();

    // TODO(@ghostwriternr): Deal with images later
    // If it's an image file, process and return base64 encoded contents
    // if (IMAGE_EXTENSIONS.has(ext)) {
    //     const data = await readImage(fullFilePath, ext);
    //     return data;
    // }

    // Handle offset properly - if offset is 0, don't subtract 1
    const lineOffset = offset === 0 ? 0 : offset - 1;
    const { content, lineCount, totalLines } = readTextContent(
        fullFilePath,
        lineOffset,
        limit
    );

    // Add size validation after reading for non-image files
    // if (!IMAGE_EXTENSIONS.has(ext) && content.length > MAX_OUTPUT_SIZE) {
    //     throw new Error(formatFileSizeError(content.length));
    // }

    const data = {
        type: 'text' as const,
        file: {
            filePath: file_path,
            content: content,
            numLines: lineCount,
            startLine: offset,
            totalLines,
        },
    };

    return data;
};
