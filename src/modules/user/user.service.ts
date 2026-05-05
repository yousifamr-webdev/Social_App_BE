import type { Request } from "express";
import redisService from "../../DB/Redis/redis.service.js";
import userRepo from "../../DB/Repo/user.repo.js";
import type { Types } from "mongoose";
import s3bucketService from "../../common/S3Bucket/s3bucket.service.js";
import type { IHUser } from "../../DB/Models/User.model.js";

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

  async uploadProfilePic(file: Express.Multer.File, user: IHUser) {
    const { key, url } =
      await this._s3BucketService.createPreSignedUploadFileUrl({
        file,
        path: `user/${user._id}/profilePic`,
      });

    if (user.profilePic) {
      await this._s3BucketService.deleteFile(user.profilePic);
    }

    user.profilePic = key;
    await user.save();

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
    await user.deleteOne();

    if (user.profilePic) {
      await this._s3BucketService.deleteFile(user.profilePic);
    }

    if (user.coverPics.length) {
      Promise.all(
        user.coverPics.map((coverPic) => {
          return this._s3BucketService.deleteFile(coverPic);
        }),
      );
    }
  }
}

export default new UserService();
