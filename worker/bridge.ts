import type { Out } from './tools/BashTool/bashTool';

export const getContext = async () => {
    const response = await fetch('http://localhost:3000/context');
    return (await response.json()) as { [k: string]: string };
};

export const lsTool = async ({ path }: { path: string }) => {
    const response = await fetch('http://localhost:3000/ls', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
    });
    return (await response.json()) as { user: string; assistant: string };
};

export const bashTool = async ({
    command,
    timeout,
}: {
    command: string;
    timeout?: number;
}) => {
    const response = await fetch('http://localhost:3000/bash', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, timeout }),
    });
    return (await response.json()) as Out;
};

export const fileReadTool = async ({
    file_path,
    offset,
    limit,
}: {
    file_path: string;
    offset?: number;
    limit?: number;
}) => {
    const response = await fetch('http://localhost:3000/fileRead', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_path, offset, limit }),
    });
    return (await response.json()) as {
        type: string;
        file: {
            filePath: string;
            content: string;
            numLines: number;
            startLine: number;
            totalLines: number;
        };
    };
};
