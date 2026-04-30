import z from "zod";

export const logoutSchema = {
  body: z.strictObject({
    logoutOptions: z.enum(["all", "one"]),
  }),
};
