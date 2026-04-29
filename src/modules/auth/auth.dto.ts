import type z from "zod";
import type { loginSchema, signupSchema, verifyEmailResendOTPSchema, verifyEmailSchema } from "./auth.validation.js";


export type SignupDto = z.infer<typeof signupSchema.body>;
export type LoginDto = z.infer<typeof loginSchema.body>;
export type verifyEmailDto = z.infer<typeof verifyEmailSchema.body>;
export type resendEmailVerficationDto = z.infer<typeof verifyEmailResendOTPSchema.body>;
