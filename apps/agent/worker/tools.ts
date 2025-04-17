import type { Tool, ToolCallResult } from '@worker/tool';
import { tool, type ToolSet } from 'ai';
import { memoize } from 'lodash-es';
import type { z } from 'zod';
import { BashTool } from './tools/BashTool/bashTool';
import { FileEditTool } from './tools/FileEditTool/FileEditTool';
import { FileReadTool } from './tools/FileReadTool/FileReadTool';
import { FileWriteTool } from './tools/FileWriteTool/FileWriteTool';
import { GlobTool } from './tools/GlobTool/globTool';
import { GrepTool } from './tools/GrepTool/grepTool';
import { LSTool } from './tools/LSTool/lstool';
import { ThinkTool } from './tools/ThinkTool/ThinkTool';

export const getAllTools = (): Tool<
    z.ZodObject<z.ZodRawShape>,
    Record<string, unknown>
>[] => {
    return [
        BashTool,
        GlobTool,
        GrepTool,
        LSTool,
        FileReadTool,
        FileEditTool,
        FileWriteTool,
        ThinkTool,
    ];
};

export const getTools = memoize(
    async (container?: Container): Promise<ToolSet> => {
        // TODO(@ghostwriternr): Add MCP tools later
        const tools = [...getAllTools()];
        const toolSet = {} as ToolSet;

        for (const t of tools) {
            toolSet[t.name] = tool({
                description: await t.description({ command: '' }),
                parameters: t.inputSchema,
                execute: async (args, options) => {
                    const generator = t.call(args, options, container);
                    const values: ToolCallResult<Record<string, unknown>>[] =
                        [];
                    for await (const result of generator) {
                        values.push(result);
                    }
                    return values;
                },
            });
        }

        return toolSet;
    }
);
