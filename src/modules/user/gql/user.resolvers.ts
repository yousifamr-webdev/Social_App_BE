import type { JwtPayload } from "jsonwebtoken";
import type { IHUser } from "../../../DB/Models/User.model.js";
import userRepo from "../../../DB/Repo/user.repo.js";
import type { ContextType } from "../../gql/type.gql.js";
import authorizationGQL from "../../../Middlewares/authorization.middleware.js";
import { RoleEnum } from "../../../common/enums/user.enums.js";
import { validationGQL } from "../../../Middlewares/validation.middleware.js";
import { getProfileSchema } from "./user.gql.validation.js";

class UserResolver {
  private _userRepo = userRepo;

  userProfile = async (
    paernt: any,
    args: { userId: string },
    context: ContextType,
  ) => {
    authorizationGQL(context.user.role, [RoleEnum.Admin]);

    validationGQL<{ userId: string }>(getProfileSchema, args);

    return context.user;
  };
}

export default new UserResolver();
