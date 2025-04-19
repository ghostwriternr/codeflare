import { logger } from '@/log';
import { normalizeFilePath, readTextContent } from '@/utils/file';
import { getCwd } from '@/utils/state';
import { readFileSync, statSync } from 'fs';
import path, { relative } from 'path';

const MAX_OUTPUT_SIZE = 0.25 * 1024 * 1024; // 0.25MB in bytes

// Common image extensions
const IMAGE_EXTENSIONS = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.bmp',
    '.webp',
]);

// Maximum dimensions for images
const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;
const MAX_IMAGE_SIZE = 3.75 * 1024 * 1024; // 5MB in bytes, with base64 encoding

export const fileReadTool = async (
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

    // If it's an image file, process and return base64 encoded contents
    if (IMAGE_EXTENSIONS.has(ext)) {
        const data = await readImage(fullFilePath, ext);
        return data;
    }

    // Handle offset properly - if offset is 0, don't subtract 1
    const lineOffset = offset === 0 ? 0 : offset - 1;
    const { content, lineCount, totalLines } = readTextContent(
        fullFilePath,
        lineOffset,
        limit
    );

    // Add size validation after reading for non-image files
    if (!IMAGE_EXTENSIONS.has(ext) && content.length > MAX_OUTPUT_SIZE) {
        throw new Error(formatFileSizeError(content.length));
    }

    const data = {
        type: 'text' as const,
        file: {
            filePath: file_path,
            relativePath: relative(getCwd(), file_path),
            content: content,
            numLines: lineCount,
            startLine: offset,
            totalLines,
        },
    };

    return data;
};

async function readImage(
    filePath: string,
    ext: string
): Promise<{
    type: 'image';
    file: {
        base64: string;
        type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    };
}> {
    try {
        const stats = statSync(filePath);
        const sharp = (
            (await import('sharp')) as unknown as {
                default: typeof import('sharp');
            }
        ).default;
        const image = sharp(readFileSync(filePath));
        const metadata = await image.metadata();

        if (!metadata.width || !metadata.height) {
            if (stats.size > MAX_IMAGE_SIZE) {
                const compressedBuffer = await image
                    .jpeg({ quality: 80 })
                    .toBuffer();
                return createImageResponse(compressedBuffer, 'jpeg');
            }
        }

        // Calculate dimensions while maintaining aspect ratio
        let width = metadata.width || 0;
        let height = metadata.height || 0;

        // Check if the original file just works
        if (
            stats.size <= MAX_IMAGE_SIZE &&
            width <= MAX_WIDTH &&
            height <= MAX_HEIGHT
        ) {
            return createImageResponse(readFileSync(filePath), ext);
        }

        if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
        }

        if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
        }

        // Resize image and convert to buffer
        const resizedImageBuffer = await image
            .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .toBuffer();

        // If still too large after resize, compress quality
        if (resizedImageBuffer.length > MAX_IMAGE_SIZE) {
            const compressedBuffer = await image
                .jpeg({ quality: 80 })
                .toBuffer();
            return createImageResponse(compressedBuffer, 'jpeg');
        }

        return createImageResponse(resizedImageBuffer, ext);
    } catch (e) {
        logger.error(e);
        // If any error occurs during processing, return original image
        return createImageResponse(readFileSync(filePath), ext);
    }
}

const formatFileSizeError = (sizeInBytes: number) =>
    `File content (${Math.round(sizeInBytes / 1024)}KB) exceeds maximum allowed size (${Math.round(MAX_OUTPUT_SIZE / 1024)}KB). Please use offset and limit parameters to read specific portions of the file, or use the GrepTool to search for specific content.`;

function createImageResponse(
    buffer: Buffer,
    ext: string
): {
    type: 'image';
    file: {
        base64: string;
        type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    };
} {
    return {
        type: 'image',
        file: {
            base64: buffer.toString('base64'),
            type: `image/${ext.slice(1)}` as
                | 'image/jpeg'
                | 'image/png'
                | 'image/gif'
                | 'image/webp',
        },
    };
}
