import type z from "zod";
import { uploadProfilePicSchema } from "./user.validation.js";

export type ProfilePicDto = z.infer<typeof uploadProfilePicSchema.body>;
