import type { Output as BashOut } from '@repo/common/types/bashTool';
import type { Output as FileEditOut } from '@repo/common/types/fileEditTool';
import type { Output as FileReadOut } from '@repo/common/types/fileReadTool';
import type { Output as FileWriteOut } from '@repo/common/types/fileWriteTool';
import type { Output as GlobOut } from '@repo/common/types/globTool';
import type { Output as GrepOut } from '@repo/common/types/grepTool';
import type { Output as LSOut } from '@repo/common/types/lsTool';

export const getContext = async () => {
    const response = await fetch('http://localhost:3000/context');
    return (await response.json()) as { [k: string]: string };
};

export const getCwd = async () => {
    const response = await fetch('http://localhost:3000/cwd');
    return (await response.json()) as { cwd: string };
};

export const getOriginalCwd = async () => {
    const response = await fetch('http://localhost:3000/originalCwd');
    return (await response.json()) as { originalCwd: string };
};

export const setCwd = async (cwd: string) => {
    const response = await fetch('http://localhost:3000/cwd', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cwd }),
    });
    return (await response.json()) as { cwd: string };
};

export const getRelativePath = async (path: string) => {
    const response = await fetch('http://localhost:3000/relativePath', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
    });
    return (await response.json()) as { path: string };
};

export const setOriginalCwd = async (originalCwd: string) => {
    const response = await fetch('http://localhost:3000/originalCwd', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalCwd }),
    });
    return (await response.json()) as { originalCwd: string };
};

export const getIsGit = async () => {
    const response = await fetch('http://localhost:3000/isGit');
    return (await response.json()) as { isGit: boolean };
};

export const lsTool = async ({
    path,
    container,
}: {
    path: string;
    container?: Container;
}) => {
    const req: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
    };
    const response = container
        ? await container.getTcpPort(3000).fetch('/ls', req)
        : await fetch('http://localhost:3000/ls', req);
    return (await response.json()) as LSOut;
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
    const response = container
        ? await container.getTcpPort(3000).fetch('/bash', req)
        : await fetch('http://localhost:3000/bash', req);
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
    const response = container
        ? await container.getTcpPort(3000).fetch('/file/read', req)
        : await fetch('http://localhost:3000/file/read', req);
    return (await response.json()) as FileReadOut;
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
    const response = container
        ? await container.getTcpPort(3000).fetch('/glob', req)
        : await fetch('http://localhost:3000/glob', req);
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
    const response = container
        ? await container.getTcpPort(3000).fetch('/grep', req)
        : await fetch('http://localhost:3000/grep', req);
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
        body: JSON.stringify({
            file_path: filePath,
            old_string: oldString,
            new_string: newString,
        }),
    };
    const response = container
        ? await container.getTcpPort(3000).fetch('/file/edit', req)
        : await fetch('http://localhost:3000/file/edit', req);
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
    const response = container
        ? await container.getTcpPort(3000).fetch('/file/write', req)
        : await fetch('http://localhost:3000/file/write', req);
    return (await response.json()) as FileWriteOut;
};
