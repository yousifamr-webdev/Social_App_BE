import express from "express";
import successResponse from "../../common/response/success.response.js";
import { authentication } from "../../Middlewares/authentication.middleware.js";
const userController = express.Router();
userController.get("/", authentication(), (req, res) => {
    return successResponse({ res, msg: "user Page.", data: req.user });
});
export default userController;
