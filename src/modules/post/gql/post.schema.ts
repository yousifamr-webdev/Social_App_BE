import { reactPostArgs } from "./post.args.js";
import postResolvers from "./post.resolvers.js";
import { reactPostType } from "./post.types.js";

class PostSchema {
  postMutations() {
    return {
      reactPost: {
        type: reactPostType,
        args: reactPostArgs,
        resolve: postResolvers.reactPost,
      },
    };
  }
}


export default new PostSchema()
