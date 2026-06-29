import type { JwtPayload } from "jsonwebtoken";
import type { IHUser, IUser } from "../../DB/Models/User.model.js";
import type { Socket } from "socket.io";

declare module "express-serve-static-core" {
  interface Request {
    user: IHUser;
    tokenPayload: JwtPayload;
  }
}

export interface SocketAuthType extends Socket {
  data: { user: IHUser; verifiedToken: JwtPayload };
}
