import { randomUUID } from "node:crypto";
import { RoleEnum } from "../enums/user.enums.js";
import {
  TOKEN_SIGNATURE_Admin_ACCESS,
  TOKEN_SIGNATURE_Admin_REFRESH,
  TOKEN_SIGNATURE_User_ACCESS,
  TOKEN_SIGNATURE_User_REFRESH,
} from "../../config/config.service.js";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { TokenEnum } from "../enums/security.enums.js";
import {
  BadRequestException,
  UnauthorizedException,
} from "../exceptions/domain.exceptions.js";
import redisService from "../../DB/Redis/redis.service.js";
import userRepo from "../../DB/Repo/user.repo.js";

class TokenService {
  private _redisService = redisService;
  private _userRepo = userRepo;
  constructor() {}
  getSignature = (role = RoleEnum.User) => {
    let accessSignature = "";
    let refreshSignature = "";
    switch (role) {
      case RoleEnum.User:
        accessSignature = TOKEN_SIGNATURE_User_ACCESS;
        refreshSignature = TOKEN_SIGNATURE_User_REFRESH;
        break;
      case RoleEnum.Admin:
        accessSignature = TOKEN_SIGNATURE_Admin_ACCESS;
        refreshSignature = TOKEN_SIGNATURE_Admin_REFRESH;
        break;
    }

    return { accessSignature, refreshSignature };
  };

  generateToken = ({
    payload = {},
    signature,
    options = {},
  }: {
    payload?: object;
    signature: string;
    options?: SignOptions;
  }) => {
    return jwt.sign(payload, signature, options);
  };
  verifyToken = ({
    token,
    signature,
  }: {
    token: string;
    signature: string;
  }) => {
    return jwt.verify(token, signature);
  };
  decodeToken = (token: string) => {
    return jwt.decode(token);
  };

  generateAccessAndRefreshTokens = ({
    role,
    sub,
  }: {
    role: RoleEnum;
    sub: string;
  }) => {
    const { accessSignature, refreshSignature } = this.getSignature(role);

    const tokenId = randomUUID();

    const access_token = this.generateToken({
      signature: accessSignature,
      options: {
        subject: sub.toString(),
        audience: [role.toString(), TokenEnum.Access.toString()],
        expiresIn: 60 * 15,
        jwtid: tokenId,
      },
    });

    const refresh_token = this.generateToken({
      signature: refreshSignature,
      options: {
        subject: sub.toString(),
        audience: [role.toString(), TokenEnum.Refresh.toString()],
        expiresIn: "1y",
        jwtid: tokenId,
      },
    });

    return { access_token, refresh_token };
  };

  async checkToken(token: string, expectedTokenType= TokenEnum.Access) {
    const decodedToken = this.decodeToken(token) as JwtPayload;

    if (!decodedToken || !decodedToken.aud) {
      throw new UnauthorizedException("Invalid Token.");
    }

    const [userRole, tokenType] = decodedToken.aud;

    if ((Number(tokenType) as TokenEnum) !== expectedTokenType) {
      throw new BadRequestException("Invalid token type.");
    }

    const { accessSignature, refreshSignature } = this.getSignature(
      Number(userRole) as RoleEnum,
    );

    const verifiedToken = this.verifyToken({
      token: token,
      signature:
        expectedTokenType == TokenEnum.Access
          ? accessSignature
          : refreshSignature,
    }) as JwtPayload;

    if (
      await this._redisService.get(
        this._redisService.blackListTokenKey({
          userId: verifiedToken.sub as string,
          tokenId: verifiedToken.jti as string,
        }),
      )
    ) {
      throw new UnauthorizedException("You need to login again.");
    }

    const user = await this._userRepo.findById({
      id: verifiedToken.sub as string,
    });

    if (!user) {
      throw new UnauthorizedException("User not found.");
    }

    if (new Date(verifiedToken.iat! * 1000) < user.changeCreditTime) {
      throw new UnauthorizedException("You need to login.");
    }


    return {
      user, verifiedToken
    }
  }
}

export default new TokenService();
