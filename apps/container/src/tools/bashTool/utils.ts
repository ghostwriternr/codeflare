// TODO(@ghostwriternr): This is probably getting defined on both container and worker
export const MAX_OUTPUT_LENGTH = 30000;

export function formatOutput(content: string): {
    totalLines: number;
    truncatedContent: string;
} {
    if (content.length <= MAX_OUTPUT_LENGTH) {
        return {
            totalLines: content.split('\n').length,
            truncatedContent: content,
        };
    }
    const halfLength = MAX_OUTPUT_LENGTH / 2;
    const start = content.slice(0, halfLength);
    const end = content.slice(-halfLength);
    const truncated = `${start}\n\n... [${content.slice(halfLength, -halfLength).split('\n').length} lines truncated] ...\n\n${end}`;

    return {
        totalLines: content.split('\n').length,
        truncatedContent: truncated,
    };
}
