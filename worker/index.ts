import { routeAgentRequest } from 'agents';
import { AIChatAgent } from 'agents/ai-chat-agent';
import { createDataStreamResponse, type StreamTextOnFinishCallback } from 'ai';
import { AsyncLocalStorage } from 'node:async_hooks';
import { getContext } from './bridge';
import { getSystemPrompt } from './constants/prompts';
import { query } from './query';
import { getTools } from './tools';
import { dateToFilename } from './utils/log';
import { getSlowAndCapableModel } from './utils/model';
import { getMaxThinkingTokens } from './utils/thinking';

export const agentContext = new AsyncLocalStorage<Chat>();

export class Chat extends AIChatAgent<Env> {
    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    async onChatMessage(onFinish: StreamTextOnFinishCallback<{}>) {
        return agentContext.run(this, async () => {
            const dataStreamResponse = createDataStreamResponse({
                execute: async (dataStream) => {
                    const [systemPrompt, context, model, maxThinkingTokens] =
                        await Promise.all([
                            getSystemPrompt(),
                            getContext(),
                            getSlowAndCapableModel(),
                            getMaxThinkingTokens(this.messages),
                        ]);
                    const [tools] = await Promise.all([getTools()]);
                    const abortController = new AbortController();

                    const result = await query(
                        [...this.messages],
                        systemPrompt,
                        context,
                        {
                            options: {
                                forkNumber: 0,
                                messageLogName: dateToFilename(new Date()),
                                tools,
                                slowAndCapableModel: model,
                                verbose: false,
                                maxThinkingTokens,
                            },
                            abortController,
                        },
                        onFinish
                    );

                    result.mergeIntoDataStream(dataStream);
                },
            });

            return dataStreamResponse;
        });
    }
}

export default {
    async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
        return (
            (await routeAgentRequest(request, env)) ||
            new Response('Not found', { status: 404 })
        );
    },
} satisfies ExportedHandler<Env>;
