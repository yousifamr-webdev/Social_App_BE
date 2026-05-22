import express from "express";
import { authentication } from "../../Middlewares/authentication.middleware.js";
import commentService from "./comment.service.js";
import { cloudUpload } from "../../common/multer/multer.config.js";
import successResponse from "../../common/response/success.response.js";
import {
  commentReactSchema,
  updateCommentSchema,
} from "./comment.validation.js";
import { validation } from "../../Middlewares/validation.middleware.js";

const commentController = express.Router();

commentController.post(
  "/:postId",
  authentication(),
  cloudUpload({}).array("attachments", 5),
  async (req, res) => {
    const result = await commentService.createComment(
      req.body,
      req.user,
      req.params.postId as string,
      req.files as Express.Multer.File[],
    );

    return successResponse({ res, data: result });
  },
);

commentController.post(
  "/:postId/reply/:commentId",
  authentication(),
  cloudUpload({}).array("attachments", 5),
  async (req, res) => {
    const result = await commentService.replyComment(
      req.body,
      req.user,
      req.params.postId as string,
      req.params.commentId as string,
      req.files as Express.Multer.File[],
    );

    return successResponse({ res, data: result });
  },
);

commentController.get(
  "/details/:commentId",
  authentication(),
  async (req, res) => {
    const result = await commentService.getCommentDetails(
      req.params.commentId as string,
      req.user,
    );

    return successResponse({ res, data: result });
  },
);

commentController.patch(
  "/:commentId",
  authentication(),
  cloudUpload({}).array("attachments", 5),
  validation(updateCommentSchema, true),
  async (req, res) => {
    const result = await commentService.updateComment(
      req.body,
      req.params.commentId as string,
      req.user._id,
      req.files as Express.Multer.File[],
    );

    return successResponse({ res, data: result });
  },
);

commentController.post(
  "/react/:commentId",
  authentication(),
  validation(commentReactSchema),
  async (req, res) => {
    const result = await commentService.commentReact(
      req.params.commentId as string,
      req.query.react as string,
      req.user,
    );

    return successResponse({ res, data: result });
  },
);

commentController.delete("/:commentId", authentication(), async (req, res) => {
  const result = await commentService.deleteComment(
    req.params.commentId as string,
    req.user._id,
  );

  return successResponse({ res, data: result });
});

export default commentController;
