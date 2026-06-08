import { GraphQLNonNull, GraphQLString } from "graphql";

export const userProfileArgs = {
  userId: { type: new GraphQLNonNull(GraphQLString) },
};
