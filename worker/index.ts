import { routeAgentRequest, type Schedule } from 'agents';
import { AIChatAgent } from 'agents/ai-chat-agent';
import {
    createDataStreamResponse,
    generateId,
    type StreamTextOnFinishCallback,
} from 'ai';
import { AsyncLocalStorage } from 'node:async_hooks';
import { getContext } from './bridge';
import { getSystemPrompt } from './constants/prompts';
import { query } from './query';
import { getTools } from './tools';
import { dateToFilename } from './utils/log';
import { getLastAssistantMessageId } from './utils/messages';
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
                            // TODO(@ghostwriternr): Pass messages to getMaxThinkingTokens
                            getMaxThinkingTokens([...this.messages]),
                        ]);
                    const [tools] = await Promise.all([getTools()]);
                    const abortController = new AbortController();

                    for await (const message of query(
                        [...this.messages],
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
                                maxThinkingTokens,
                            },
                            // TODO(@ghostwriternr): Fix this, maybe?
                            messageId: getLastAssistantMessageId(this.messages),
                            // TODO(@ghostwriternr): When and why is this used?
                            readFileTimestamps: {},
                            abortController,
                        }
                    )) {
                        // console.log(message);
                        console.log('new message', message.message.content[0]);
                    }

                    result.mergeIntoDataStream(dataStream);
                },
            });

            return dataStreamResponse;
        });
    }

    async executeTask(description: string, _task: Schedule<string>) {
        await this.saveMessages([
            ...this.messages,
            {
                id: generateId(),
                role: 'user',
                content: `Running scheduled task: ${description}`,
                createdAt: new Date(),
            },
        ]);
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
