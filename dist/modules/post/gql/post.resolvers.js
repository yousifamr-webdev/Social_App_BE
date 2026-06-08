import { validationGQL } from "../../../Middlewares/validation.middleware.js";
import postService from "../post.service.js";
import { reactPostSchema } from "./post.gql.validation.js";
class PostResolver {
    _postService = postService;
    reactPost = async (parent, args, context) => {
        validationGQL(reactPostSchema, args);
        const result = await this._postService.postReact(args.postId, args.react, context.user);
        return {
            _id: result._id,
            likes: result.likes,
        };
    };
}
export default new PostResolver();
