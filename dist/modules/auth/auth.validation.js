import z from "zod";
import { commonValidationFields } from "../../Middlewares/validation.middleware.js";
export const loginSchema = {
    body: z.strictObject({
        email: commonValidationFields.email,
        password: commonValidationFields.password,
    }),
};
export const signupSchema = {
    body: loginSchema.body
        .extend({
        userName: commonValidationFields.userName,
        confirmPassword: z.string(),
        age: commonValidationFields.age,
        gender: commonValidationFields.gender.optional(),
        phone: commonValidationFields.phone.optional(),
    })
        .refine((data) => {
        return data.confirmPassword === data.password;
    }, { error: "Passwords do not match." }),
};
export const verifyEmailSchema = {
    body: z.strictObject({
        email: commonValidationFields.email,
        otp: commonValidationFields.OTP,
    }),
};
export const verifyEmailResendOTPSchema = {
    body: z.strictObject({
        email: commonValidationFields.email,
    }),
};
export const forgetPasswordOTPSchema = {
    body: verifyEmailResendOTPSchema.body,
};
export const resendForgetPasswordVerificationOTPSchema = {
    body: verifyEmailResendOTPSchema.body,
};
export const verifyForgetPasswordSchema = {
    body: verifyEmailSchema.body,
};
export const resetPasswordSchema = {
    body: verifyEmailSchema.body.extend({
        password: commonValidationFields.password,
    }),
};
export const singupWithGmailSchema = {
    body: z.object({
        idToken: z.string(),
    }),
};
