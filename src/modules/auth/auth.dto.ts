import type z from "zod";
import type {
  forgetPasswordOTPSchema,
  loginSchema,
  resendForgetPasswordVerificationOTPSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailResendOTPSchema,
  verifyEmailSchema,
  verifyForgetPasswordSchema,
} from "./auth.validation.js";

export type SignupDto = z.infer<typeof signupSchema.body>;
export type LoginDto = z.infer<typeof loginSchema.body>;
export type verifyEmailDto = z.infer<typeof verifyEmailSchema.body>;
export type resendEmailVerficationDto = z.infer<
  typeof verifyEmailResendOTPSchema.body
>;

export type forgetPasswordOTPDto = z.infer<typeof forgetPasswordOTPSchema.body>;

export type resendForgetPasswordVerificationOTPDto = z.infer<
  typeof resendForgetPasswordVerificationOTPSchema.body
>;

export type verifyForgetPasswordOTPDto = z.infer<
  typeof verifyForgetPasswordSchema.body
>;

export type resetPasswordDto = z.infer<typeof resetPasswordSchema.body>;
