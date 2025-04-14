import { memoize } from 'lodash-es';
import { Tool } from './tool';
import { BashTool } from './tools/BashTool/bashTool';
import { FileReadTool } from './tools/FileReadTool/FileReadTool';
import { LSTool } from './tools/LSTool/lstool';

export const getAllTools = (): Tool[] => {
    return [BashTool, LSTool, FileReadTool];
};

export const getTools = memoize(async (): Promise<Tool[]> => {
    // TODO(@ghostwriternr): Add MCP tools later
    const tools = [...getAllTools()];

    const isEnabled = await Promise.all(tools.map((tool) => tool.isEnabled()));
    return tools.filter((_, i) => isEnabled[i]);
});
