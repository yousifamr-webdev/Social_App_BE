import { Router } from "express";
import { authentication } from "../../Middlewares/authentication.middleware.js";
import chatService from "./chat.service.js";
import successResponse from "../../common/response/success.response.js";
import { cloudUpload } from "../../common/multer/multer.config.js";
const chatController = Router({ mergeParams: true });
chatController.get("/", authentication(), async (req, res) => {
    const result = await chatService.getChat(req.params.userId, req.user);
    return successResponse({ res, data: result });
});
chatController.post("/create-group", authentication(), cloudUpload({}).single("attachment"), async (req, res) => {
    const result = await chatService.createGroup(req.body.participants, req.body.group, req.file, req.user);
    return successResponse({ res, data: result });
});
chatController.get("/group/:groupId", authentication(), async (req, res) => {
    const result = await chatService.getGroupChat(req.params.groupId, req.user);
    return successResponse({ res, data: result });
});
export default chatController;
