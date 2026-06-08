import { GraphQLEnumType, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString, } from "graphql";
export const reactPostType = new GraphQLObjectType({
    name: "reactPostType",
    fields: {
        _id: { type: new GraphQLNonNull(GraphQLID) },
        likes: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
    },
});
