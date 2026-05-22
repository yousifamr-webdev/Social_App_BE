import type z from "zod";
import type { updateCommentSchema } from "./comment.validation.js";



export type UpdateCommentSchemaDto = z.infer<typeof updateCommentSchema.body>;