import type { Request } from "express";
import redisService from "../../DB/Redis/redis.service.js";
import userRepo from "../../DB/Repo/user.repo.js";
import type { Types } from "mongoose";
import s3bucketService from "../../common/S3Bucket/s3bucket.service.js";
import type { IHUser } from "../../DB/Models/User.model.js";
import type { ProfilePicDto } from "./user.dto.js";
import { BadRequestException } from "./../../common/exceptions/domain.exceptions.js";

class UserService {
  private _userRepo = userRepo;
  private _redisMethods = redisService;
  private _s3BucketService = s3bucketService;

  public async logout(req: Request) {
    const userId = req.user._id as string | Types.ObjectId;
    const tokenData = req.tokenPayload;
    const logoutOptions = req.body.logoutOptions;

    if (logoutOptions === "all") {
      await this._userRepo.updateOne({
        filter: { _id: userId },
        update: { changeCreditTime: new Date() },
      });
    } else {
      await this._redisMethods.set({
        key: this._redisMethods.blackListTokenKey({
          userId: userId as string,
          tokenId: tokenData.jti as string,
        }),
        value: tokenData.jti as string | number,
        exValue: 60 * 60 * 24 * 365 - (Date.now() / 1000 - tokenData.iat!),
      });
    }

    return { msg: "Logout Successful." };
  }

  async uploadProfilePic(bodyData: ProfilePicDto, user: IHUser) {
    const { key, url } =
      await this._s3BucketService.createPreSignedUploadFileUrl({
        originalname: bodyData.originalname,
        contentType: bodyData.contentType,
        path: `user/${user._id}/profilePic`,
      });

    if (user.profilePic) {
      await this._s3BucketService.deleteFile(user.profilePic);
    }

    return { key, url };
  }

  async uploadCoverPics(files: Express.Multer.File[], user: IHUser) {
    const keys = await this._s3BucketService.uploadFiles({
      files,
      path: `user/${user._id}/coverPics`,
    });

    if (user.coverPics.length) {
      Promise.all(
        user.coverPics.map((coverPic) => {
          return this._s3BucketService.deleteFile(coverPic);
        }),
      );
    }

    user.coverPics = keys;
    await user.save();

    return keys;
  }

  async deleteUser(user: IHUser) {
    const deleteUser = await user.deleteOne();

    if (deleteUser.deletedCount !== 1) {
      return new BadRequestException("Failed to delete user.");
    }

    const response = await this._s3BucketService.listFolderKeys(
      `user/${user._id}`,
    );
    const Keys = response.Contents?.map((file) => {
      return { Key: file.Key };
    });

    await this._s3BucketService.deleteFiles(Keys as { Key: string }[]);
  }

  async deleteProfilePic(user: IHUser) {
    if (user.profilePic) {
      await this._s3BucketService.deleteFile(user.profilePic);
    }

    await this._userRepo.updateOne({
      filter: { _id: user._id },
      update: { $unset: { profilePic: 1 } },
    });

    return { msg: "Your profile picture was deleted successfully." };
  }

  async updateCoverPics(
    bodyData: any,
    user: IHUser,
    coverPics?: Express.Multer.File[],
  ) {
    const keys = coverPics
      ? await this._s3BucketService.uploadFiles({
          files: coverPics,
          path: `user/${user._id}/coverPics`,
        })
      : [];

    const userAfter = await this._userRepo.findOneAndUpdate({
      filter: { _id: user._id },
      update: [
        {
          $set: {
            coverPics: {
              $setUnion: [
                {
                  $setDifference: ["$coverPics", bodyData.removePics || []],
                },
                keys || [],
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

    if (bodyData.removePics?.length) {
      Promise.all(
        bodyData.removePics.map((coverPic: string) => {
          return this._s3BucketService.deleteFile(coverPic);
        }),
      );
    }

    return userAfter?.coverPics;
  }
}

export default new UserService();
