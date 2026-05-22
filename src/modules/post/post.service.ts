import type { Types } from "mongoose";
import type {
  CreatePostSchemaDto,
  FindPostSchemaDto,
  UpdatePostSchemaDto,
} from "./post.dto.js";
import postRepo from "../../DB/Repo/post.repo.js";
import userRepo from "../../DB/Repo/user.repo.js";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/exceptions/domain.exceptions.js";
import redisService from "../../DB/Redis/redis.service.js";
import notificationService from "../../common/Notification/notification.service.js";
import s3bucketService from "../../common/S3Bucket/s3bucket.service.js";
import { PostPrivacyEnum } from "../../common/enums/post.enum.js";
import type { IHUser } from "../../DB/Models/User.model.js";
import type { IHPost, IPost } from "../../DB/Models/Post.model.js";
import { BUCKET_NAME } from "../../config/config.service.js";

class PostService {
  private _postRepo = postRepo;
  private _userRepo = userRepo;
  private _redisService = redisService;
  private _notificationService = notificationService;
  private _s3Bucket = s3bucketService;

  async createPost(
    bodyData: any,
    userId: Types.ObjectId | string,
    files?: Express.Multer.File[],
  ) {
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
      createdBy: userId as Types.ObjectId,
    });

    if (files?.length) {
      const filesPaths = await this._s3Bucket.uploadFiles({
        files: files as Express.Multer.File[],
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

  async findPosts(user: IHUser, queryData: FindPostSchemaDto) {
    const searchQuery = queryData.search?.length
      ? { content: { $regex: queryData.search as string, $options: "i" } }
      : {};

    return await this._postRepo.paginate({
      filter: {
        $or: this._postRepo.checkPostPrivacy(user),
        ...searchQuery,
      },
      page: queryData.page as number,
      size: queryData.size as number,
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

  async updatePost(
    bodyData: UpdatePostSchemaDto,
    postId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    files?: Express.Multer.File[],
  ) {
    const post = await this._postRepo.findOne({
      filter: { _id: postId, createdBy: userId },
    });

    if (!post) {
      throw new NotFoundException("Post not found.");
    }

    if (
      !post.content &&
      !bodyData.content &&
      !post.attachments?.length &&
      !files?.length &&
      post.attachments?.length == bodyData.removeFiles?.length
    ) {
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

    let uploadedFiles: string[] = [];

    if (files?.length) {
      const filesPaths = await this._s3Bucket.uploadFiles({
        files: files as Express.Multer.File[],
        path: `post/${post?._id}`,
      });

      uploadedFiles = filesPaths;
    }

    if (bodyData.removeFiles?.length) {
      const removedFiles: { Key: string }[] = bodyData.removeFiles.map(
        (path) => {
          return { Key: path };
        },
      );

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

  async postReact(
    postId: Types.ObjectId | string,
    react: number | string,
    user: IHUser,
  ) {
    const updateQuery =
      react == 0
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

  async deletePost(postId: string, userId: Types.ObjectId) {
    const response = await this._s3Bucket.listFolderKeys(`post/${postId}`);
    const Keys = response.Contents?.map((file) => {
      return { Key: file.Key };
    });

    await this._s3Bucket.deleteFiles(Keys as { Key: string }[]);

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
