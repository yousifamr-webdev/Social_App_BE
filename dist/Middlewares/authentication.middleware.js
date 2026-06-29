import TokenService from "../common//security/token.service.js";
import RedisService from "../DB/Redis/redis.service.js";
import { BadRequestException, UnauthorizedException, } from "../common/exceptions/domain.exceptions.js";
import { TokenEnum } from "../common/enums/security.enums.js";
import UserRepo from "./../DB/Repo/user.repo.js";
const redisMethods = RedisService;
const tokenService = TokenService;
export function authentication(expectedTokenType = TokenEnum.Access) {
    return async (req, res, next) => {
        const { authorization } = req.headers;
        if (!authorization) {
            throw new UnauthorizedException("You need to login first.");
        }
        const [BearerKey, token] = authorization.split(" ");
        if (BearerKey !== "Bearer") {
            throw new BadRequestException("Invalid authentication key.");
        }
        if (!token) {
            throw new UnauthorizedException("You need to login first.");
        }
        const { user, verifiedToken } = await tokenService.checkToken(token, expectedTokenType);
        req.user = user;
        req.tokenPayload = verifiedToken;
        next();
    };
}
