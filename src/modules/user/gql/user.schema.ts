import { GraphQLNonNull, GraphQLString } from "graphql";
import userRepo from "../../../DB/Repo/user.repo.js";
import userResolvers from "./user.resolvers.js";
import { userProfileType } from "./user.types.js";
import { userProfileArgs } from "./user.args.js";

class UserSchema {
  userQueries() {
    return {
      getUserProfile: {
        type: userProfileType,
        args: userProfileArgs,
        resolve: userResolvers.userProfile,
        description: "Testing...",
      },
    };
  }
}

export default new UserSchema();
