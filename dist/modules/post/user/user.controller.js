import express from "express";
import successResponse from "../../common/response/success.response.js";
import { authentication } from "../../Middlewares/authentication.middleware.js";
import { validation } from "../../Middlewares/validation.middleware.js";
import userService from "./user.service.js";
import { logoutSchema, uploadProfilePicSchema } from "./user.validation.js";
import { cloudUpload } from "../../common/multer/multer.config.js";
import { StorageApproachEnum } from "../../common/enums/multer.enums.js";
const userController = express.Router();
userController.get("/", authentication(), (req, res) => {
    return successResponse({ res, msg: "user Page.", data: req.user });
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
export default userController;
