import z from "zod";

export const testSchema = z.object({ message: z.string().min(2) });
