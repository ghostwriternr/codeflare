import { getSystemPrompt } from './constants/prompts';
import { query } from './query';

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

                const [systemPrompt, context, model, maxThinkingTokens] =
                    await Promise.all([
                        getSystemPrompt(),
                        getContext(),
                        getSlowAndCapableModel(),
                        getMaxThinkingTokens([...messages, ...newMessages]),
                    ]);
                for await (const message of query(
                    [],
                    systemPrompt,
                    context,
                    canUseTool,
                    {
                        options: {
                            commands,
                            forkNumber,
                            messageLogName,
                            tools,
                            slowAndCapableModel: model,
                            verbose,
                            dangerouslySkipPermissions,
                            maxThinkingTokens,
                        },
                        messageId: getLastAssistantMessageId([
                            ...messages,
                            lastMessage,
                        ]),
                        readFileTimestamps: readFileTimestamps.current,
                        abortController,
                    }
                )) {
                    setMessages((oldMessages) => [...oldMessages, message]);
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
