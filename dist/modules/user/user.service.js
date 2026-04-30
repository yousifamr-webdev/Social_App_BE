import redisService from "../../DB/Redis/redis.service.js";
import userRepo from "../../DB/Repo/user.repo.js";
class UserService {
    _userRepo = userRepo;
    _redisMethods = redisService;
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
}
export default new UserService();
