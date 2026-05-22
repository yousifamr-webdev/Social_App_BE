import z from "zod";
import { PostPrivacyEnum } from "../../../common/enums/post.enum.js";
import { Types } from "mongoose";
export const createPostSchema = {
    body: z
        .object({
        content: z.string().min(3).max(1000).optional(),
        tags: z.array(z.string()).optional(),
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
        for (const tag of args.tags) {
            if (!Types.ObjectId.isValid(tag)) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: `Invalid tag ObjectId ${tag}`,
                });
            }
        }
        const uniqueTags = [...new Set(args.tags)];
        if (uniqueTags.length !== args.tags?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: `Duplicated values`,
            });
        }
    }),
};
export const createPostSchema = {
    body: z
        .object({
        content: z.string().min(3).max(1000).optional(),
        tags: z.array(z.string()).optional(),
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
        for (const tag of args.tags) {
            if (!Types.ObjectId.isValid(tag)) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: `Invalid tag ObjectId ${tag}`,
                });
            }
        }
        const uniqueTags = [...new Set(args.tags)];
        if (uniqueTags.length !== args.tags?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: `Duplicated values`,
            });
        }
    }),
};
