import type z from "zod";
import type {
  createPostSchema,
  findPostSchema,
  updatePostSchema,
} from "./post.validation.js";

export type CreatePostSchemaDto = z.infer<typeof createPostSchema.body>;

export type FindPostSchemaDto = z.infer<typeof findPostSchema.query>;

export type UpdatePostSchemaDto = z.infer<typeof updatePostSchema.body>;
