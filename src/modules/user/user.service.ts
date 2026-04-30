import type { Request } from "express";
import redisService from "../../DB/Redis/redis.service.js";
import userRepo from "../../DB/Repo/user.repo.js";
import type { Types } from "mongoose";

class UserService {
  private _userRepo = userRepo;
  private _redisMethods = redisService;

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
}

export default new UserService();
