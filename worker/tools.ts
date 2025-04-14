import { memoize } from 'lodash-es';
import { Tool } from './tool';

export const getAllTools = (): Tool[] => {
    return [];
};

export const getTools = memoize(async (): Promise<Tool[]> => {
    // TODO(@ghostwriternr): Add MCP tools later
    const tools = [...getAllTools()];

    const isEnabled = await Promise.all(tools.map((tool) => tool.isEnabled()));
    return tools.filter((_, i) => isEnabled[i]);
});
