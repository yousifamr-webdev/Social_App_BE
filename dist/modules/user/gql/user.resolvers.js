import userRepo from "../../../DB/Repo/user.repo.js";
import authorizationGQL from "../../../Middlewares/authorization.middleware.js";
import { RoleEnum } from "../../../common/enums/user.enums.js";
import { validationGQL } from "../../../Middlewares/validation.middleware.js";
import { getProfileSchema } from "./user.gql.validation.js";
class UserResolver {
    _userRepo = userRepo;
    userProfile = async (paernt, args, context) => {
        authorizationGQL(context.user.role, [RoleEnum.Admin]);
        validationGQL(getProfileSchema, args);
        return context.user;
    };
}
export default new UserResolver();
