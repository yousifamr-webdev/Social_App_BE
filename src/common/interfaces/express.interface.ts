import type { JwtPayload } from "jsonwebtoken";
import type { IHUser } from "../../DB/Models/User.model.js";

declare module "express-serve-static-core" {
  interface Request {
    user: IHUser;
    tokenPayload: JwtPayload;
  }
}
