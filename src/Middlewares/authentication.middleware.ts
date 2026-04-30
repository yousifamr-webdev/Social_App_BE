import TokenService from "../common//security/token.service.js";
import RedisService from "../DB/Redis/redis.service.js";
import type { Request, Response, NextFunction } from "express";
import {
  BadRequestException,
  UnauthorizedException,
} from "../common/exceptions/domain.exceptions.js";
import { TokenEnum } from "../common/enums/security.enums.js";
import type { JwtPayload } from "jsonwebtoken";
import type { RoleEnum } from "../common/enums/user.enums.js";
import UserRepo from "./../DB/Repo/user.repo.js";

const redisMethods = RedisService;
const tokenService = TokenService;

export function authentication(expectedTokenType = TokenEnum.Access) {
  return async (req: Request, res: Response, next: NextFunction) => {
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

    const decodedToken = tokenService.decodeToken(token) as JwtPayload;

    if (!decodedToken || !decodedToken.aud) {
      throw new UnauthorizedException("Invalid Token.");
    }

    const [userRole, tokenType] = decodedToken.aud;

    if ((Number(tokenType) as TokenEnum) !== expectedTokenType) {
      throw new BadRequestException("Invalid token type.");
    }

    const { accessSignature, refreshSignature } = tokenService.getSignature(
      Number(userRole) as RoleEnum,
    );

    const verifiedToken = tokenService.verifyToken({
      token: token,
      signature:
        expectedTokenType == TokenEnum.Access
          ? accessSignature
          : refreshSignature,
    }) as JwtPayload;

    if (
      await redisMethods.get(
        redisMethods.blackListTokenKey({
          userId: verifiedToken.sub as string,
          tokenId: verifiedToken.jti as string,
        }),
      )
    ) {
      throw new UnauthorizedException("You need to login again.");
    }

    const user = await UserRepo.findById({ id: verifiedToken.sub as string });

    if (!user) {
      throw new UnauthorizedException("User not found.");
    }

    if (new Date(verifiedToken.iat! * 1000) < user.changeCreditTime) {
      throw new UnauthorizedException("You need to login.");
    }

    req.user = user;
    req.tokenPayload = verifiedToken;

    next();
  };
}
