import postRepo from "../../DB/Repo/post.repo.js";
import userRepo from "../../DB/Repo/user.repo.js";
import { BadRequestException, NotFoundException, } from "../../common/exceptions/domain.exceptions.js";
import redisService from "../../DB/Redis/redis.service.js";
import notificationService from "../../common/Notification/notification.service.js";
import s3bucketService from "../../common/S3Bucket/s3bucket.service.js";
import { PostPrivacyEnum } from "../../common/enums/post.enum.js";
import { BUCKET_NAME } from "../../config/config.service.js";
class PostService {
    _postRepo = postRepo;
    _userRepo = userRepo;
    _redisService = redisService;
    _notificationService = notificationService;
    _s3Bucket = s3bucketService;
    async createPost(bodyData, userId, files) {
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
        console.log(bodyData);
        const post = this._postRepo.getDBDoc({
            ...bodyData,
            createdBy: userId,
        });
        if (files?.length) {
            const filesPaths = await this._s3Bucket.uploadFiles({
                files: files,
                path: `post/${post?._id}`,
            });
            post.attachments = filesPaths;
        }
        for (const tag of bodyData.tags || []) {
            const tokens = await this._redisService.getMemberFCMToken(tag);
            if (tokens.length) {
                await this._notificationService.sendMultipleNotifications({
                    tokens,
                    data: {
                        title: "Mentioned",
                        body: JSON.stringify({
                            postId: post?._id,
                            message: "You were mentioned in a post.",
                        }),
                    },
                });
            }
        }
        return await this._postRepo.saveDBDoc(post);
    }
    async findPosts(user, queryData) {
        const searchQuery = queryData.search?.length
            ? { content: { $regex: queryData.search, $options: "i" } }
            : {};
        return await this._postRepo.paginate({
            filter: {
                $or: this._postRepo.checkPostPrivacy(user),
                ...searchQuery,
            },
            page: queryData.page,
            size: queryData.size,
            options: {
                populate: [
                    {
                        path: "comments",
                        match: { commentId: { $exists: false } },
                        populate: [
                            {
                                path: "replies",
                            },
                        ],
                    },
                ],
            },
        });
    }
    async updatePost(bodyData, postId, userId, files) {
        const post = await this._postRepo.findOne({
            filter: { _id: postId, createdBy: userId },
        });
        if (!post) {
            throw new NotFoundException("Post not found.");
        }
        if (!post.content &&
            !bodyData.content &&
            !post.attachments?.length &&
            !files?.length &&
            post.attachments?.length == bodyData.removeFiles?.length) {
            throw new BadRequestException("Post cannot be  empty.");
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
                path: `post/${post?._id}`,
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
                            postId: post?._id,
                            message: "You were mentioned in a post.",
                        }),
                    },
                });
            }
        }
        return await this._postRepo.findOneAndUpdate({
            filter: { _id: postId },
            update: [
                {
                    $set: {
                        content: bodyData.content || post.content,
                        privacy: bodyData.privacy || post.privacy,
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
    async postReact(postId, react, user) {
        const updateQuery = react == 0
            ? { $addToSet: { likes: user._id } }
            : { $pull: { likes: user._id } };
        const post = await this._postRepo.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: this._postRepo.checkPostPrivacy(user),
            },
            update: updateQuery,
            options: { returnDocument: "after" },
        });
        if (!post) {
            throw new NotFoundException("Post not found.");
        }
        return post;
    }
    async deletePost(postId, userId) {
        const response = await this._s3Bucket.listFolderKeys(`post/${postId}`);
        const Keys = response.Contents?.map((file) => {
            return { Key: file.Key };
        });
        await this._s3Bucket.deleteFiles(Keys);
        const deletePost = await this._postRepo.deleteOne({
            filter: { _id: postId, createdBy: userId },
        });
        if (deletePost.deletedCount !== 1) {
            throw new BadRequestException("Failed to delete post.");
        }
        return { msg: "Post was deleted successfully" };
    }
}
export default new PostService();
