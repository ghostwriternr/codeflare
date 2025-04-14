import { getContext } from './bridge';
import { getSystemPrompt } from './constants/prompts';
import { query } from './query';
import { getTools } from './tools';
import { dateToFilename } from './utils/log';
import { createUserMessage, getLastAssistantMessageId } from './utils/messages';
import { getSlowAndCapableModel } from './utils/model';
import { getMaxThinkingTokens } from './utils/thinking';

export default {
    async fetch(request) {
        const url = new URL(request.url);

        if (request.method === 'POST' && url.pathname === '/trigger') {
            try {
                const body = (await request.json()) as { prompt?: unknown };

                if (!body.prompt || typeof body.prompt !== 'string') {
                    return new Response(
                        "Missing or invalid 'prompt' in request body",
                        { status: 400 }
                    );
                }

                const newMessages = [createUserMessage(body.prompt)];

                const [systemPrompt, context, model, maxThinkingTokens] =
                    await Promise.all([
                        getSystemPrompt(),
                        getContext(),
                        getSlowAndCapableModel(),
                        // TODO(@ghostwriternr): Pass messages to getMaxThinkingTokens
                        getMaxThinkingTokens([...newMessages]),
                    ]);
                const [tools] = await Promise.all([getTools()]);
                const abortController = new AbortController();

                for await (const message of query(
                    [...newMessages],
                    systemPrompt,
                    context,
                    // TODO(@ghostwriternr): Implement canUseTool when it makes sense
                    () => Promise.resolve({ result: true }),
                    {
                        options: {
                            commands: [],
                            forkNumber: 0,
                            messageLogName: dateToFilename(new Date()),
                            tools,
                            slowAndCapableModel: model,
                            verbose: false,
                            dangerouslySkipPermissions: false,
                            maxThinkingTokens,
                        },
                        // TODO(@ghostwriternr): Fix this, maybe?
                        messageId: getLastAssistantMessageId([...newMessages]),
                        // TODO(@ghostwriternr): When and why is this used?
                        readFileTimestamps: {},
                        abortController,
                    }
                )) {
                    console.log(message);
                    // console.log('new message', message.message.content[0]);
                }

                const response = await fetch('http://localhost:3000/trigger', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt: body.prompt }),
                });

                const data = await response.json();
                return Response.json(data);
            } catch (error) {
                return new Response('Invalid JSON payload', { status: 400 });
            }
        }
        return new Response('Not found', { status: 404 });
    },
} satisfies ExportedHandler<Env>;
