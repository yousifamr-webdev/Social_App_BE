import redisService from "../../DB/Redis/redis.service.js";
import userRepo from "../../DB/Repo/user.repo.js";
import s3bucketService from "../../common/S3Bucket/s3bucket.service.js";
class UserService {
    _userRepo = userRepo;
    _redisMethods = redisService;
    _s3BucketService = s3bucketService;
    async logout(req) {
        const userId = req.user._id;
        const tokenData = req.tokenPayload;
        const logoutOptions = req.body.logoutOptions;
        if (logoutOptions === "all") {
            await this._userRepo.updateOne({
                filter: { _id: userId },
                update: { changeCreditTime: new Date() },
            });
        }
        else {
            await this._redisMethods.set({
                key: this._redisMethods.blackListTokenKey({
                    userId: userId,
                    tokenId: tokenData.jti,
                }),
                value: tokenData.jti,
                exValue: 60 * 60 * 24 * 365 - (Date.now() / 1000 - tokenData.iat),
            });
        }
        return { msg: "Logout Successful." };
    }
    async uploadProfilePic(file, user) {
        const { key, url } = await this._s3BucketService.createPreSignedUploadFileUrl({
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
    async uploadCoverPics(files, user) {
        const keys = await this._s3BucketService.uploadFiles({
            files,
            path: `user/${user._id}/coverPics`,
        });
        if (user.coverPics.length) {
            Promise.all(user.coverPics.map((coverPic) => {
                return this._s3BucketService.deleteFile(coverPic);
            }));
        }
        user.coverPics = keys;
        await user.save();
        return keys;
    }
    async deleteUser(user) {
        await user.deleteOne();
        if (user.profilePic) {
            await this._s3BucketService.deleteFile(user.profilePic);
        }
        if (user.coverPics.length) {
            Promise.all(user.coverPics.map((coverPic) => {
                return this._s3BucketService.deleteFile(coverPic);
            }));
        }
    }
}
export default new UserService();
