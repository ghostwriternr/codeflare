import { dateToFilename } from '@repo/common/logger';
import { routeAgentRequest } from 'agents';
import { AIChatAgent } from 'agents/ai-chat-agent';
import { createDataStreamResponse, type StreamTextOnFinishCallback } from 'ai';
import { AsyncLocalStorage } from 'node:async_hooks';
import { getContext, setCwd, setOriginalCwd } from './bridge';
import { getSystemPrompt } from './constants/prompts';
import { logger } from './log';
import { query } from './query';
import { getTools } from './tools';
import { getSlowAndCapableModel } from './utils/model';
import { getMaxThinkingTokens } from './utils/thinking';

export const agentContext = new AsyncLocalStorage<Chat>();

export class Chat extends AIChatAgent<Env> {
    container: globalThis.Container | undefined;

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        this.container = ctx.container;
        logger.info('Initializing chat agent', {
            hasContainer: !!this.container,
        });
        void this.ctx.blockConcurrencyWhile(async () => {
            if (this.container) {
                if (!this.container.running) {
                    logger.info('Starting container for chat agent');
                    this.container.start();
                } else {
                    logger.debug('Container already running');
                }
            } else {
                logger.warn('No container available for chat agent');
            }
        });
    }

    onStart(): void | Promise<void> {
        const repositoryPath = process.env.REPOSITORY_PATH ?? '/app/agents';
        logger.info('Initializing agent environment', { repositoryPath });
        logger.debug('Setting working directories', {
            originalCwd: repositoryPath,
            currentCwd: repositoryPath,
        });
        setOriginalCwd(repositoryPath);
        setCwd(repositoryPath);
    }

    async onChatMessage(
        onFinish: StreamTextOnFinishCallback<NonNullable<unknown>>
    ) {
        return agentContext.run(this, async () => {
            logger.info('Processing chat message');
            const dataStreamResponse = createDataStreamResponse({
                execute: async (dataStream) => {
                    logger.debug('Preparing chat context');
                    const [systemPrompt, context, model, maxThinkingTokens] =
                        await Promise.all([
                            getSystemPrompt(),
                            getContext(),
                            getSlowAndCapableModel(),
                            getMaxThinkingTokens(this.messages),
                        ]);
                    logger.debug('Loading tools', {
                        hasContainer: !!this.container,
                    });
                    const [tools] = await Promise.all([
                        getTools(this.container),
                    ]);
                    logger.info('Starting query execution', {
                        messageCount: this.messages.length,
                        toolCount: tools.length,
                    });
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

                    logger.debug('Merging query result into data stream');
                    result.mergeIntoDataStream(dataStream);
                },
            });

            return dataStreamResponse;
        });
    }
}

export default {
    fetch: async (request: Request, env: Env) => {
        logger.debug('Received agent request', {
            method: request.method,
            url: request.url,
        });
        const response = await routeAgentRequest(request, env);
        if (response) {
            return response;
        }

        logger.warn('No route found for request', {
            method: request.method,
            url: request.url,
        });
        return new Response('Not found', { status: 404 });
    },
} satisfies ExportedHandler<Env>;
