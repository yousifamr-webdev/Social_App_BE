import z from "zod";
export const logoutSchema = {
    body: z.strictObject({
        logoutOptions: z.enum(["all", "one"]),
    }),
};
export const uploadProfilePicSchema = {
    body: z.strictObject({
        originalname: z.string(),
        contentType: z.string(),
    }),
};
export const updateCoverPicsSchema = {
    body: z.object({
        coverPics: z.array(z.any()).optional(),
        removePics: z.array(z.string()).optional(),
    }),
};
