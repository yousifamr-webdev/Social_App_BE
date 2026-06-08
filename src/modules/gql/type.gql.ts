import type { JwtPayload } from "jsonwebtoken";
import type { IHUser } from "../../DB/Models/User.model.js";

export type ContextType = { user: IHUser; tokenPayload: JwtPayload };
