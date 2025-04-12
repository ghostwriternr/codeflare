import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
    return c.text('Cloud Code!');
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
