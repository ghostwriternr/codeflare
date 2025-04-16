import { z } from "zod";

export const inputSchema = z.strictObject({
    path: z
        .string()
        .describe(
            'The absolute path to the directory to list (must be absolute, not relative)'
        ),
});
