import postRepo from "../../../DB/Repo/post.repo.js";
import userRepo from "../../../DB/Repo/user.repo.js";
import { BadRequestException, NotFoundException, } from "../../../common/exceptions/domain.exceptions.js";
import redisService from "../../../DB/Redis/redis.service.js";
import notificationService from "../../../common/Notification/notification.service.js";
import s3bucketService from "../../../common/S3Bucket/s3bucket.service.js";
import { PostPrivacyEnum } from "../../../common/enums/post.enum.js";
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
            const post = this._postRepo.getDBDoc(bodyData);
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
            post.createdBy = userId;
            return await this._postRepo.saveDBDoc(post);
        }
    }
    async findPost(user, queryData) {
        return await this._postRepo.paginate({
            filter: {
                $or: this._postRepo.checkPostPrivacy(user),
                content: { $regex: queryData.search, $options: "i" },
            },
            page: queryData.page,
            size: queryData.size,
        });
    }
}
export default new PostService();
