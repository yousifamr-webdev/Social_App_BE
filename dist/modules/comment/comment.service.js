import userRepo from "../../DB/Repo/user.repo.js";
import { BadRequestException, NotFoundException, UnauthorizedException, } from "../../common/exceptions/domain.exceptions.js";
import redisService from "../../DB/Redis/redis.service.js";
import notificationService from "../../common/Notification/notification.service.js";
import s3bucketService from "../../common/S3Bucket/s3bucket.service.js";
import commentRepo from "../../DB/Repo/comment.repo.js";
import postRepo from "../../DB/Repo/post.repo.js";
class CommentService {
    _commentRepo = commentRepo;
    _postRepo = postRepo;
    _userRepo = userRepo;
    _redisService = redisService;
    _notificationService = notificationService;
    _s3Bucket = s3bucketService;
    async createComment(bodyData, user, postId, files) {
        const post = await this._postRepo.findOne({
            filter: {
                _id: postId,
                $or: this._postRepo.checkPostPrivacy(user),
            },
        });
        if (!post) {
            throw new NotFoundException("Post not found.");
        }
        const comment = this._commentRepo.getDBDoc({
            ...bodyData,
            createdBy: user._id,
            postId,
        });
        if (bodyData.tags?.length) {
            const mentionedUsers = await this._userRepo.find({
                filter: {
                    _id: { $in: bodyData.tags },
                },
            });
            if (mentionedUsers.length != bodyData.tags.length) {
                throw new NotFoundException("failed to find tagged users");
            }
        }
        if (files?.length) {
            const filesPaths = await this._s3Bucket.uploadFiles({
                files: files,
                path: `post/${postId}/comment/${comment?._id}`,
            });
            comment.attachments = filesPaths;
        }
        for (const tag of bodyData.tags || []) {
            const tokens = await this._redisService.getMemberFCMToken(tag);
            if (tokens.length) {
                await this._notificationService.sendMultipleNotifications({
                    tokens,
                    data: {
                        title: "Mentioned",
                        body: JSON.stringify({
                            postId: comment?._id,
                            message: "You were mentioned in a comment.",
                        }),
                    },
                });
            }
        }
        return await this._commentRepo.saveDBDoc(comment);
    }
    async replyComment(bodyData, user, postId, commentId, files) {
        const parentComment = await this._commentRepo.findOne({
            filter: {
                _id: commentId,
                postId,
            },
            options: {
                populate: [
                    {
                        path: "postId",
                        match: {
                            $or: this._postRepo.checkPostPrivacy(user),
                        },
                    },
                ],
            },
        });
        if (!parentComment || !parentComment.postId) {
            throw new NotFoundException("Comment or post is unavailable.");
        }
        const comment = this._commentRepo.getDBDoc({
            ...bodyData,
            createdBy: user._id,
            postId,
            commentId,
        });
        if (bodyData.tags?.length) {
            const mentionedUsers = await this._userRepo.find({
                filter: {
                    _id: { $in: bodyData.tags },
                },
            });
            if (mentionedUsers.length != bodyData.tags.length) {
                throw new NotFoundException("failed to find tagged users");
            }
        }
        if (files?.length) {
            const filesPaths = await this._s3Bucket.uploadFiles({
                files: files,
                path: `post/${postId}/comment/${commentId}/reply/${comment?._id}`,
            });
            comment.attachments = filesPaths;
        }
        for (const tag of bodyData.tags || []) {
            const tokens = await this._redisService.getMemberFCMToken(tag);
            if (tokens.length) {
                await this._notificationService.sendMultipleNotifications({
                    tokens,
                    data: {
                        title: "Mentioned",
                        body: JSON.stringify({
                            postId: comment?._id,
                            message: "You were mentioned in a comment.",
                        }),
                    },
                });
            }
        }
        return await this._commentRepo.saveDBDoc(comment);
    }
    async getCommentDetails(commentId, user) {
        const comment = await this._commentRepo.findById({
            id: commentId,
            options: {
                populate: [
                    {
                        path: "postId",
                        match: {
                            $or: this._postRepo.checkPostPrivacy(user),
                        },
                    },
                    {
                        path: "commentId",
                    },
                ],
            },
        });
        if (!comment || !comment.postId) {
            throw new NotFoundException("Comment not found.");
        }
        return comment;
    }
    async updateComment(bodyData, commentId, userId, files) {
        const comment = await this._commentRepo.findOne({
            filter: { _id: commentId, createdBy: userId },
        });
        if (!comment) {
            throw new NotFoundException("Comment not found.");
        }
        if (!comment.content &&
            !bodyData.content &&
            !comment.attachments?.length &&
            !files?.length &&
            comment.attachments?.length == bodyData.removeFiles?.length) {
            throw new BadRequestException("Comment cannot be  empty.");
        }
        if (bodyData.tags) {
            const mentionedUsers = await this._userRepo.find({
                filter: {
                    _id: { $in: bodyData.tags },
                },
            });
            if (mentionedUsers.length != bodyData.tags.length) {
                throw new NotFoundException("failed to find tagged users");
            }
        }
        let uploadedFiles = [];
        if (files?.length) {
            const filesPaths = await this._s3Bucket.uploadFiles({
                files: files,
                path: `post/${comment.postId}` + !comment.commentId
                    ? `/comment/${commentId}`
                    : `/comment/${comment.commentId}/reply/${commentId}`,
            });
            uploadedFiles = filesPaths;
        }
        if (bodyData.removeFiles?.length) {
            const removedFiles = bodyData.removeFiles.map((path) => {
                return { Key: path };
            });
            await this._s3Bucket.deleteFiles(removedFiles);
        }
        for (const tag of bodyData.tags || []) {
            const tokens = await this._redisService.getMemberFCMToken(tag);
            if (tokens.length) {
                await this._notificationService.sendMultipleNotifications({
                    tokens,
                    data: {
                        title: "Mentioned",
                        body: JSON.stringify({
                            commentId: comment?._id,
                            message: "You were mentioned in a post.",
                        }),
                    },
                });
            }
        }
        return await this._commentRepo.findOneAndUpdate({
            filter: { _id: commentId },
            update: [
                {
                    $set: {
                        content: bodyData.content || comment.content,
                        tags: {
                            $setUnion: [
                                {
                                    $setDifference: ["$tags", bodyData.removeTags || []],
                                },
                                bodyData.tags || [],
                            ],
                        },
                        attachments: {
                            $setUnion: [
                                {
                                    $setDifference: ["$attachments", bodyData.removeFiles || []],
                                },
                                uploadedFiles || [],
                            ],
                        },
                    },
                },
            ],
            options: {
                updatePipeline: true,
                returnDocument: "after",
            },
        });
    }
    async commentReact(commentId, react, user) {
        const updateQuery = react == 0
            ? { $addToSet: { likes: user._id } }
            : { $pull: { likes: user._id } };
        const comment = await this._commentRepo.findOneAndUpdate({
            filter: {
                _id: commentId,
            },
            update: updateQuery,
            options: { returnDocument: "after" },
        });
        if (!comment) {
            throw new NotFoundException("Comment not found.");
        }
        return comment;
    }
    async deleteComment(commentId, userId) {
        const comment = await this._commentRepo.findOne({
            filter: { _id: commentId, createdBy: userId },
        });
        const response = await this._s3Bucket.listFolderKeys(!comment?.commentId
            ? `post/${comment?.postId}/comment/${commentId}`
            : `post/${comment?.postId}/comment/${comment?.commentId}/${commentId}`);
        const Keys = response.Contents?.map((file) => {
            return { Key: file.Key };
        });
        await this._s3Bucket.deleteFiles(Keys);
        const deleteComment = await this._commentRepo.deleteOne({
            filter: { _id: commentId, createdBy: userId },
        });
        if (deleteComment.deletedCount !== 1) {
            return new BadRequestException("Failed to delete comment.");
        }
        return { msg: "Comment was deleted successfully" };
    }
}
export default new CommentService();
