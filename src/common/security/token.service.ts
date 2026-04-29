import { randomUUID } from "node:crypto";
import { RoleEnum } from "../enums/user.enums.js";
import {
  TOKEN_SIGNATURE_Admin_ACCESS,
  TOKEN_SIGNATURE_Admin_REFRESH,
  TOKEN_SIGNATURE_User_ACCESS,
  TOKEN_SIGNATURE_User_REFRESH,
} from "../../config/config.service.js";
import jwt, { type SignOptions} from "jsonwebtoken";
import { TokenEnum } from "../enums/security.enums.js";

class TokenService {
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
}

export default new TokenService();
