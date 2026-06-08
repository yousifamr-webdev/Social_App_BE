import z from "zod";
import { commonValidationFields } from "../../../Middlewares/validation.middleware.js";
export const getProfileSchema = z.object({
    userId: commonValidationFields.id,
});
