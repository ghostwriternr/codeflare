import { createLogger } from '@repo/common/log/logger';
import { dateToFilename } from '@repo/common/utils/log';
import { routeAgentRequest } from 'agents';
import { AIChatAgent } from 'agents/ai-chat-agent';
import { createDataStreamResponse, type StreamTextOnFinishCallback } from 'ai';
import { AsyncLocalStorage } from 'node:async_hooks';
import { getContext, setCwd, setOriginalCwd } from './bridge';
import { getSystemPrompt } from './constants/prompts';
import { query } from './query';
import { getTools } from './tools';
import { getSlowAndCapableModel } from './utils/model';
import { getMaxThinkingTokens } from './utils/thinking';

export const agentContext = new AsyncLocalStorage<Chat>();

export class Chat extends AIChatAgent<Env> {
    private logger = createLogger('worker');
    container: globalThis.Container | undefined;

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        this.container = ctx.container;
        this.logger.info('Initializing chat agent');
        void this.ctx.blockConcurrencyWhile(async () => {
            if (this.container && !this.container.running)
                this.container.start();
        });
    }

    onStart(): void | Promise<void> {
        const repositoryPath = process.env.REPOSITORY_PATH ?? '/app/agents';
        setOriginalCwd(repositoryPath);
        setCwd(repositoryPath);
    }

    async onChatMessage(
        onFinish: StreamTextOnFinishCallback<NonNullable<unknown>>
    ) {
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
                    const [tools] = await Promise.all([
                        getTools(this.container),
                    ]);
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
    fetch: async (request: Request, env: Env) => {
        return (
            (await routeAgentRequest(request, env)) ||
            new Response('Not found', { status: 404 })
        );
    },
} satisfies ExportedHandler<Env>;
