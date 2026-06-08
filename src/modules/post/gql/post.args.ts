import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";

export const reactPostArgs = {
  postId: { type: new GraphQLNonNull(GraphQLString) },
  react: {
    type: new GraphQLNonNull(
      new GraphQLEnumType({
        name: "reactEnum",
        values: { like: { value: 0 }, dislike: { value: 1 } },
      }),
    ),
  },
};
