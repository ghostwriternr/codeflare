import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { getContext } from './context';
import { logger } from './log';
import { bashTool } from './tools/bashTool/bashTool';
import { fileEditTool } from './tools/fileEditTool/fileEditTool';
import { fileReadTool } from './tools/fileReadTool/fileReadTool';
import { fileWriteTool } from './tools/fileWriteTool/fileWriteTool';
import { globTool } from './tools/globTool/globTool';
import { grepTool } from './tools/grepTool/grepTool';
import { lsTool } from './tools/lsTool/lsTool';
import { getIsGit } from './utils/git';
import { getCwd, getOriginalCwd, setCwd, setOriginalCwd } from './utils/state';
import { relative } from 'path';

const app = new Hono();

// Store file read timestamps
const readFileTimestamps: Record<string, number> = {};

app.get('/', (c) => {
    return c.text('Codeflare!');
});

app.get('/context', async (c) => {
    const context = await getContext();
    return c.json(context);
});

app.get('/cwd', (c) => {
    const cwd = getCwd();
    return c.json({ cwd });
});

app.get('/originalCwd', (c) => {
    const originalCwd = getOriginalCwd();
    return c.json({ originalCwd });
});

app.post('/cwd', async (c) => {
    const { cwd } = await c.req.json();
    await setCwd(cwd);
    return c.json({ cwd });
});

app.post('/originalCwd', async (c) => {
    const { originalCwd } = await c.req.json();
    setOriginalCwd(originalCwd);
    return c.json({ originalCwd });
});

app.post('/relativePath', async (c) => {
    const { path } = await c.req.json();
    const cwd = getCwd();
    const relativePath = relative(cwd, path);
    return c.json({ path: relativePath });
});

app.get('/isGit', async (c) => {
    const isGit = await getIsGit();
    return c.json({ isGit });
});

app.post('/ls', async (c) => {
    const { path = '.' } = await c.req.json();
    // TODO(@ghostwriternr): Obviously this is pointless, but we move on for now.
    const abortController = new AbortController();
    const result = lsTool(path, abortController);
    return c.json(result);
});

app.post('/bash', async (c) => {
    const { command, timeout = 120000 } = await c.req.json();
    if (!command) {
        return c.json({ error: 'Command is required' }, 400);
    }
    const abortController = new AbortController();
    const result = await bashTool({ command, timeout }, { abortController });
    return c.json(result);
});

app.post('/file/read', async (c) => {
    const { file_path, offset = 0, limit } = await c.req.json();
    if (!file_path) {
        return c.json({ error: 'file_path is required' }, 400);
    }
    const result = await fileReadTool(
        { file_path, offset, limit },
        { readFileTimestamps }
    );
    return c.json(result);
});

app.post('/file/edit', async (c) => {
    const { file_path, old_string, new_string } = await c.req.json();
    if (!file_path) {
        return c.json({ error: 'file_path is required' }, 400);
    }
    const result = fileEditTool({ file_path, old_string, new_string });
    return c.json(result);
});

app.post('/file/write', async (c) => {
    const { file_path, content } = await c.req.json();
    if (!file_path) {
        return c.json({ error: 'file_path is required' }, 400);
    }
    const result = fileWriteTool({ file_path, content });
    return c.json(result);
});

app.post('/glob', async (c) => {
    const { pattern, path } = await c.req.json();
    if (!pattern) {
        return c.json({ error: 'pattern is required' }, 400);
    }
    const abortController = new AbortController();
    const result = await globTool({ pattern, path }, { abortController });
    return c.json(result);
});

app.post('/grep', async (c) => {
    const { pattern, path, include } = await c.req.json();
    if (!pattern) {
        return c.json({ error: 'pattern is required' }, 400);
    }
    const abortController = new AbortController();
    const result = await grepTool(
        { pattern, path, include },
        { abortController }
    );
    return c.json(result);
});

app.post('/trigger', async (c) => {
    const body = await c.req.json();
    return c.json({ response: body.prompt });
});

serve(
    {
        fetch: app.fetch,
        port: 3000,
    },
    (info) => {
        logger.info(`Server is running on http://localhost:${info.port}`);
    }
);
