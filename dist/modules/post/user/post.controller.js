import express from "express";
import successResponse from "../../../common/response/success.response.js";
import { authentication } from "../../../Middlewares/authentication.middleware.js";
import { cloudUpload } from "../../../common/multer/multer.config.js";
import { validation } from "../../../Middlewares/validation.middleware.js";
import { createPostSchema } from "./post.validation.js";
import postService from "./post.service.js";
const postController = express.Router();
postController.post("/", authentication(), cloudUpload({}).array("attachments", 5), validation(createPostSchema, true), async (req, res) => {
    const result = await postService.createPost(req.body, req.user._id, req.files);
    return successResponse({ res, data: result });
});
postController.get("/", authentication(), async (req, res) => {
    const result = await postService.findPost(req.user, req.query);
    return successResponse({ res, data: result });
});
export default postController;
