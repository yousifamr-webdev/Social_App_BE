import express from "express";
import AuthService from "./auth.service.js";
import successResponse from "../../common/response/success.response.js";
import { forgetPasswordOTPSchema, loginSchema, resendForgetPasswordVerificationOTPSchema, signupSchema, singupWithGmailSchema, verifyEmailResendOTPSchema, verifyEmailSchema, verifyForgetPasswordSchema, } from "./auth.validation.js";
import { validation } from "../../Middlewares/validation.middleware.js";
const authController = express.Router();
authController.get("/", (req, res) => {
    return successResponse({ res, msg: "Auth Page." });
});
authController.post("/signup", validation(signupSchema), async (req, res) => {
    const result = await AuthService.signup(req.body);
    return successResponse({ res, data: result });
});
authController.post("/login", validation(loginSchema), async (req, res) => {
    const result = await AuthService.login(req.body);
    return successResponse({
        res,
        data: result,
    });
});
authController.post("/verify-email", validation(verifyEmailSchema), async (req, res) => {
    const result = await AuthService.verifyEmail(req.body);
    return successResponse({ res, data: result });
});
authController.post("/verify-email-resendOtp", validation(verifyEmailResendOTPSchema), async (req, res) => {
    const result = await AuthService.resendEmailVerificationOTP(req.body);
    return successResponse({ res, data: result });
});
authController.post("/forget-password", validation(forgetPasswordOTPSchema), async (req, res) => {
    const result = await AuthService.forgetPasswordOTP(req.body);
    return successResponse({ res, data: result });
});
authController.post("/forget-password-resend", validation(resendForgetPasswordVerificationOTPSchema), async (req, res) => {
    const result = await AuthService.resendForgetPasswordVerificationOTP(req.body);
    return successResponse({ res, data: result });
});
authController.post("/verify-forget-password", validation(verifyForgetPasswordSchema), async (req, res) => {
    const result = await AuthService.verifyForgetPasswordOTP(req.body);
    return successResponse({ res, data: result });
});
authController.post("/signup/gmail", validation(singupWithGmailSchema), async (req, res) => {
    const result = await AuthService.signupWithGmail(req.body.idToken);
    return successResponse({ res, data: result });
});
export default authController;
