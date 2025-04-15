import { tool, type ToolSet } from 'ai';
import { memoize } from 'lodash-es';
import type { Tool } from './tool';
import { BashTool } from './tools/BashTool/bashTool';
import { FileReadTool } from './tools/FileReadTool/FileReadTool';
import { GlobTool } from './tools/GlobTool/globTool';
import { GrepTool } from './tools/GrepTool/grepTool';
import { LSTool } from './tools/LSTool/lstool';

export const getAllTools = (): Tool[] => {
    return [BashTool, LSTool, FileReadTool, GlobTool, GrepTool];
};

export const getTools = memoize(async (): Promise<ToolSet> => {
    // TODO(@ghostwriternr): Add MCP tools later
    const tools = [...getAllTools()];
    const toolSet = {} as ToolSet;

    for (const t of tools) {
        toolSet[t.name] = tool({
            description: await t.description({ command: '' }),
            parameters: t.inputSchema,
            execute: async (args, options) => {
                // @ts-ignore TODO(@ghostwriternr): Type this properly
                return await t.call(args, options);
            },
        });
    }

    return toolSet;
});
