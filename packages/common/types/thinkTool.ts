import { z } from "zod";

export const inputSchema = z.object({
    thought: z.string().describe('Your thoughts.'),
});
