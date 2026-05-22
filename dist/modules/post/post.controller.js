import express from "express";
import successResponse from "../../common/response/success.response.js";
import { authentication } from "../../Middlewares/authentication.middleware.js";
import { cloudUpload } from "../../common/multer/multer.config.js";
import { validation } from "../../Middlewares/validation.middleware.js";
import { createPostSchema, findPostSchema, postReactSchema, updatePostSchema, } from "./post.validation.js";
import postService from "./post.service.js";
const postController = express.Router();
postController.patch("/:postId", authentication(), cloudUpload({}).array("attachments", 5), validation(updatePostSchema, true), async (req, res) => {
    const result = await postService.updatePost(req.body, req.params.postId, req.user._id, req.files);
    return successResponse({ res, data: result });
});
postController.post("/", authentication(), cloudUpload({}).array("attachments", 5), validation(createPostSchema, true), async (req, res) => {
    const result = await postService.createPost(req.body, req.user._id, req.files);
    return successResponse({ res, data: result });
});
postController.get("/", authentication(), validation(findPostSchema), async (req, res) => {
    const result = await postService.findPosts(req.user, req.query);
    return successResponse({ res, data: result });
});
postController.post("/react/:postId", authentication(), validation(postReactSchema), async (req, res) => {
    const result = await postService.postReact(req.params.postId, req.query.react, req.user);
    return successResponse({ res, data: result });
});
postController.delete("/:postId", authentication(), async (req, res) => {
    const result = await postService.deletePost(req.params.postId, req.user._id);
    return successResponse({
        res,
        data: result,
    });
});
export default postController;
