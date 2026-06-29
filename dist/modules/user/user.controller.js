import express from "express";
import successResponse from "../../common/response/success.response.js";
import { authentication } from "../../Middlewares/authentication.middleware.js";
import { validation } from "../../Middlewares/validation.middleware.js";
import userService from "./user.service.js";
import { logoutSchema, updateCoverPicsSchema, uploadProfilePicSchema, } from "./user.validation.js";
import { cloudUpload } from "../../common/multer/multer.config.js";
import { StorageApproachEnum } from "../../common/enums/multer.enums.js";
import chatController from "../chat/chat.controller.js";
const userController = express.Router();
userController.use("/:userId/chat", chatController);
userController.get("/", authentication(), async (req, res) => {
    const result = await userService.getUserData(req.user);
    return successResponse({ res, msg: "user Page.", data: result });
});
userController.post("/upload-profile-pic", authentication(), cloudUpload({
    storageApproach: StorageApproachEnum.Disk,
    fileSize: 25,
}).single("profilePic"), validation(uploadProfilePicSchema), async (req, res) => {
    const result = await userService.uploadProfilePic(req.body, req.user);
    return successResponse({
        res,
        msg: "Uploaded successfully.",
        data: result,
    });
});
userController.post("/upload-cover-pics", authentication(), cloudUpload({
    storageApproach: StorageApproachEnum.Memory,
    fileSize: 25,
}).array("coverPics"), async (req, res) => {
    const result = await userService.uploadCoverPics(req.files, req.user);
    return successResponse({
        res,
        msg: "Uploaded successfully.",
        data: result,
    });
});
userController.delete("/", authentication(), async (req, res) => {
    const result = await userService.deleteUser(req.user);
    return successResponse({
        res,
        msg: "Deleted successfully.",
    });
});
userController.post("/logout", authentication(), validation(logoutSchema), async (req, res) => {
    const result = await userService.logout(req);
    return successResponse({ res, data: result });
});
userController.delete("/profilePic", authentication(), async (req, res) => {
    const result = await userService.deleteProfilePic(req.user);
    return successResponse({
        res,
        data: result,
    });
});
userController.patch("/coverPics", authentication(), cloudUpload({
    storageApproach: StorageApproachEnum.Memory,
    fileSize: 25,
}).array("coverPics", 5), validation(updateCoverPicsSchema, true), async (req, res) => {
    const result = await userService.updateCoverPics(req.body, req.user, req.files);
    return successResponse({ res, data: result });
});
export default userController;
