/**
 * Adds cat -n style line numbers to the content
 */
export function addLineNumbers({
    content,
    // 1-indexed
    startLine,
}: {
    content: string;
    startLine: number;
}): string {
    if (!content) {
        return '';
    }

    return content
        .split(/\r?\n/)
        .map((line, index) => {
            const lineNum = index + startLine;
            const numStr = String(lineNum);
            // Handle large numbers differently
            if (numStr.length >= 6) {
                return `${numStr}\t${line}`;
            }
            // Regular numbers get padding to 6 characters
            const n = numStr.padStart(6, ' ');
            return `${n}\t${line}`;
        })
        .join('\n'); // TODO: This probably won't work for Windows
}
