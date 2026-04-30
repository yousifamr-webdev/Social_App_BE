import express from "express";
import successResponse from "../../common/response/success.response.js";
import { authentication } from "../../Middlewares/authentication.middleware.js";
import { validation } from "../../Middlewares/validation.middleware.js";
import userService from "./user.service.js";
import { logoutSchema } from "./user.validation.js";

const userController = express.Router();

userController.get("/", authentication(), (req, res) => {
  return successResponse({ res, msg: "user Page.", data: req.user });
});

userController.post(
  "/logout",
  authentication(),
  validation(logoutSchema),
  async (req, res) => {
    const result = await userService.logout(req);

    return successResponse<any>({ res, data: result });
  },
);

export default userController;
