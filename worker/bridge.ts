import type { Output as BashOut } from './tools/BashTool/bashTool';
import type { Output as FileEditOut } from './tools/FileEditTool/FileEditTool';
import type { Output as FileWriteOut } from './tools/FileWriteTool/FileWriteTool';
import type { Output as GlobOut } from './tools/GlobTool/globTool';
import type { Output as GrepOut } from './tools/GrepTool/grepTool';

export const getContext = async () => {
    const response = await fetch('http://localhost:3000/context');
    return (await response.json()) as { [k: string]: string };
};

export const lsTool = async ({ path, container }: { path: string; container?: Container }) => {
    const req: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
    };
    const response = container ? await container.getTcpPort(3000).fetch('/ls', req) : await fetch('http://localhost:3000/ls', req);
    return (await response.json()) as { user: string; assistant: string };
};

export const bashTool = async ({
    container,
    command,
    timeout,
}: {
    container?: Container;
    command: string;
    timeout?: number;
}) => {
    const req: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, timeout }),
    };
    const response = container ? await container.getTcpPort(3000).fetch('/bash', req) : await fetch('http://localhost:3000/bash', req);
    return (await response.json()) as BashOut;
};

export const fileReadTool = async ({
    file_path,
    offset,
    limit,
    container,
}: {
    file_path: string;
    offset?: number;
    limit?: number;
    container?: Container;
}) => {
    const req: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_path, offset, limit }),
    };
    const response = container ? await container.getTcpPort(3000).fetch('/file/read', req) : await fetch('http://localhost:3000/file/read', req);
    return await response.text();
};

export const globTool = async ({
    pattern,
    path,
    container,
}: {
    pattern: string;
    path?: string;
    container?: Container;
}) => {
    const req: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pattern, path }),
    };
    const response = container ? await container.getTcpPort(3000).fetch('/glob', req) : await fetch('http://localhost:3000/glob', req);
    return (await response.json()) as GlobOut;
};

export const grepTool = async ({
    pattern,
    path,
    include,
    container,
}: {
    pattern: string;
    path?: string;
    include?: string;
    container?: Container;
}) => {
    const req: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pattern, path, include }),
    };
    const response = container ? await container.getTcpPort(3000).fetch('/grep', req) : await fetch('http://localhost:3000/grep', req);
    return (await response.json()) as GrepOut;
};

export const fileEditTool = async ({
    filePath,
    oldString,
    newString,
    container,
}: {
    filePath: string;
    oldString: string;
    newString: string;
    container?: Container;
}) => {
    const req: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_path: filePath, old_string: oldString, new_string: newString }),
    };
    const response = container ? await container.getTcpPort(3000).fetch('/file/edit', req) : await fetch('http://localhost:3000/file/edit', req);
    return (await response.json()) as FileEditOut;
};

export const fileWriteTool = async ({
    file_path,
    content,
    container,
}: {
    file_path: string;
    content: string;
    container?: Container;
}) => {
    const req: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_path, content }),
    };
    const response = container ? await container.getTcpPort(3000).fetch('/file/write', req) : await fetch('http://localhost:3000/file/write', req);
    return (await response.json()) as FileWriteOut;
};
