import z from "zod";
import { PostPrivacyEnum } from "../../common/enums/post.enum.js";
import { Types } from "mongoose";
import { commonValidationFields } from "../../Middlewares/validation.middleware.js";
export const updateCommentSchema = {
    body: z
        .object({
        content: z.string().min(3).max(1000).optional(),
        tags: z.array(commonValidationFields.id).optional(),
        removeTags: z.array(commonValidationFields.id).optional(),
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
        commentId: commonValidationFields.id,
    }),
};
export const commentReactSchema = {
    query: z.object({
        react: z.coerce.number(),
    }),
};
