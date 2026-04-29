import express from "express";
import AuthService from "./auth.service.js";
import successResponse from "../../common/response/success.response.js";
import type { LoginDto, SignupDto } from "./auth.dto.js";
import z from "zod";
import { BadRequestException } from "../../common/exceptions/domain.exceptions.js";
import {
  loginSchema,
  signupSchema,
  verifyEmailResendOTPSchema,
  verifyEmailSchema,
} from "./auth.validation.js";
import { validation } from "../../Middlewares/validation.middleware.js";

const authController = express.Router();

authController.get("/", (req, res) => {
  return successResponse({ res, msg: "Auth Page." });
});

authController.post("/signup", validation(signupSchema), async (req, res) => {
  const result = await AuthService.signup(req.body);

  return successResponse<any>({ res, data: result });
});

authController.post("/login", validation(loginSchema), async (req, res) => {
  const result = await AuthService.login(req.body);

  return successResponse<{ access_token: string; refresh_token: string }>({
    res,
    data: result,
  });
});

authController.post(
  "/verify-email",
  validation(verifyEmailSchema),
  async (req, res) => {
    const result = await AuthService.verifyEmail(req.body);

    return successResponse<any>({ res, data: result });
  },
);

authController.post(
  "/verify-email-resendOtp",
  validation(verifyEmailResendOTPSchema),
  async (req, res) => {
    const result = await AuthService.resendEmailVerificationOTP(req.body);

    return successResponse<any>({ res, data: result });
  },
);

export default authController;
