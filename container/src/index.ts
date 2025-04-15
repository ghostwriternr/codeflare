import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { getContext } from './context.js';
import { bashTool } from './tools/bashTool/bashTool.js';
import { fileEditTool } from './tools/fileEditTool/fileEditTool.js';
import { fileReadTool } from './tools/fileReadTool/fileReadTool.js';
import { fileWriteTool } from './tools/fileWriteTool/fileWriteTool.js';
import { globTool } from './tools/globTool/globTool.js';
import { lsTool } from './tools/lsTool/lsTool.js';

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

app.post('/fileRead', async (c) => {
    const { file_path, offset = 0, limit } = await c.req.json();
    if (!file_path) {
        return c.json({ error: 'file_path is required' }, 400);
    }
    const result = fileReadTool(
        { file_path, offset, limit },
        { readFileTimestamps }
    );
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

app.post('/fileEdit', async (c) => {
    const { file_path, old_string, new_string } = await c.req.json();
    if (!file_path) {
        return c.json({ error: 'file_path is required' }, 400);
    }
    const result = fileEditTool({ file_path, old_string, new_string });
    return c.json(result);
});

app.post('/fileWrite', async (c) => {
    const { file_path, content } = await c.req.json();
    if (!file_path) {
        return c.json({ error: 'file_path is required' }, 400);
    }
    const result = fileWriteTool({ file_path, content });
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
        console.log(`Server is running on http://localhost:${info.port}`);
    }
);
