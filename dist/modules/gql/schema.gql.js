import { GraphQLObjectType, GraphQLSchema } from "graphql";
import userSchema from "../user/gql/user.schema.js";
import postSchema from "../post/gql/post.schema.js";
const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: "querySchema",
        fields: {
            ...userSchema.userQueries(),
        },
    }),
    mutation: new GraphQLObjectType({
        name: "mutationSchema",
        fields: {
            ...postSchema.postMutations(),
        },
    }),
});
export default schema;
