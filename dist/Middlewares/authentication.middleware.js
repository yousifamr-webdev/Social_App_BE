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
        const decodedToken = tokenService.decodeToken(token);
        if (!decodedToken || !decodedToken.aud) {
            throw new UnauthorizedException("Invalid Token.");
        }
        const [userRole, tokenType] = decodedToken.aud;
        if (Number(tokenType) !== expectedTokenType) {
            throw new BadRequestException("Invalid token type.");
        }
        const { accessSignature, refreshSignature } = tokenService.getSignature(Number(userRole));
        const verifiedToken = tokenService.verifyToken({
            token: token,
            signature: expectedTokenType == TokenEnum.Access
                ? accessSignature
                : refreshSignature,
        });
        if (await redisMethods.get(redisMethods.blackListTokenKey({
            userId: verifiedToken.sub,
            tokenId: verifiedToken.jti,
        }))) {
            throw new UnauthorizedException("You need to login again.");
        }
        const user = await UserRepo.findById({ id: verifiedToken.sub });
        if (!user) {
            throw new UnauthorizedException("User not found.");
        }
        if (new Date(verifiedToken.iat * 100) < user.changeCreditTime) {
            throw new UnauthorizedException("You need to login.");
        }
        req.user = user;
        req.tokenPayload = verifiedToken;
        next();
    };
}
