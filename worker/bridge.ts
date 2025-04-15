import type { Output as BashOut } from './tools/BashTool/bashTool';
import type { Output as FileEditOut } from './tools/FileEditTool/FileEditTool';
import type { Output as FileWriteOut } from './tools/FileWriteTool/FileWriteTool';
import type { Output as GlobOut } from './tools/GlobTool/globTool';
import type { Output as GrepOut } from './tools/GrepTool/grepTool';

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
    return (await response.json()) as BashOut;
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

export const globTool = async ({
    pattern,
    path,
}: {
    pattern: string;
    path?: string;
}) => {
    const response = await fetch('http://localhost:3000/glob', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pattern, path }),
    });
    return (await response.json()) as GlobOut;
};

export const grepTool = async ({
    pattern,
    path,
    include,
}: {
    pattern: string;
    path?: string;
    include?: string;
}) => {
    const response = await fetch('http://localhost:3000/grep', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pattern, path, include }),
    });
    return (await response.json()) as GrepOut;
};

export const fileEditTool = async ({
    filePath: file_path,
    oldString: old_string,
    newString: new_string,
}: {
    filePath: string;
    oldString: string;
    newString: string;
}) => {
    const response = await fetch('http://localhost:3000/fileEdit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_path, old_string, new_string }),
    });
    return (await response.json()) as FileEditOut;
};

export const fileWriteTool = async ({
    file_path,
    content,
}: {
    file_path: string;
    content: string;
}) => {
    const response = await fetch('http://localhost:3000/fileWrite', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_path, content }),
    });
    return (await response.json()) as FileWriteOut;
};
