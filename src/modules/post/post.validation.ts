import z from "zod";
import { PostPrivacyEnum } from "../../common/enums/post.enum.js";
import { Types } from "mongoose";
import { commonValidationFields } from "../../Middlewares/validation.middleware.js";

export const createPostSchema = {
  body: z
    .object({
      content: z.string().min(3).max(1000).optional(),
      tags: z.array(commonValidationFields.id).optional(),
      privacy: z.coerce.number().default(PostPrivacyEnum.PUBLIC),
      files: z.array(z.any()).optional(),
    })
    .superRefine((args, ctx) => {
      if (!args.files?.length && !args.content) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "You must add content or upload one attachment.",
        });
      }

      if (args.tags?.length) {
        const uniqueTags = [...new Set(args.tags)];

        if (uniqueTags.length !== args.tags?.length) {
          ctx.addIssue({
            code: "custom",
            path: ["tags"],
            message: `Duplicated values`,
          });
        }
      }
    }),
};

export const findPostSchema = {
  query: z.object({
    page: z.coerce.number().optional(),
    size: z.coerce.number().optional(),
    search: z.string().optional(),
  }),
};

export const updatePostSchema = {
  body: z
    .object({
      content: z.string().min(3).max(1000).optional(),
      tags: z.array(commonValidationFields.id).optional(),
      removeTags: z.array(commonValidationFields.id).optional(),
      privacy: z.coerce.number().optional(),
      files: z.array(z.any()).optional(),
      removeFiles: z.array(z.any()).optional(),
    })
    .superRefine((args, ctx) => {
      if (args.tags?.length) {
        const uniqueTags = [...new Set(args.tags)];

        if (uniqueTags.length !== args.tags?.length) {
          ctx.addIssue({
            code: "custom",
            path: ["tags"],
            message: `Duplicated values`,
          });
        }
      }
    }),

  params: z.object({
    postId: commonValidationFields.id,
  }),
};

export const postReactSchema = {
  query: z.object({
    react: z.coerce.number(),
  }),
};
