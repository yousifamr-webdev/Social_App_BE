import z from "zod";
import { commonValidationFields } from "../../../Middlewares/validation.middleware.js";
export const reactPostSchema = z.object({
    postId: commonValidationFields.id,
    react: z.coerce.number()
});
