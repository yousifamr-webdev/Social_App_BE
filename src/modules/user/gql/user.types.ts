import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../../../common/enums/user.enums.js";

export const userProfileType = new GraphQLObjectType({
  name: "UserType",
  fields: {
    _id: { type: new GraphQLNonNull(GraphQLID) },
    userName: {
      type: GraphQLString,
      resolve: (parent) => {
        return parent.gender == GenderEnum.Male
          ? "Mr." + parent.userName
          : "Ms." + parent.userName;
      },
    },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    provider: {
      type: new GraphQLEnumType({
        name: "providerEnum",
        values: {
          Google: {
            value: ProviderEnum.Google,
          },
          System: {
            value: ProviderEnum.System,
          },
        },
      }),
    },
    confirmEmail: { type: GraphQLBoolean },
    profilePic: { type: GraphQLString },
    coverPics: { type: new GraphQLList(GraphQLString) },
    friends: { type: new GraphQLList(GraphQLString) },
    age: { type: GraphQLInt },
    phone: { type: GraphQLString },
    gender: {
      type: new GraphQLEnumType({
        name: "genderEnum",
        values: {
          Male: {
            value: GenderEnum.Male,
          },
          Female: {
            value: GenderEnum.Female,
          },
        },
      }),
    },
    role: {
      type: new GraphQLEnumType({
        name: "roleEnum",
        values: {
          User: {
            value: RoleEnum.User,
          },
          Admin: {
            value: RoleEnum.Admin,
          },
        },
      }),
    },
    changeCreditTime: { type: GraphQLString },
    deletedAt: { type: GraphQLString },
  },
});
