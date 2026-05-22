import DBRepo from "./db.repo.js";
import postModel from "./../Models/Post.model.js";
import { PostPrivacyEnum } from "../../common/enums/post.enum.js";
class PostRepo extends DBRepo {
    constructor() {
        super(postModel);
    }
    checkPostPrivacy(user) {
        return [
            {
                privacy: PostPrivacyEnum.PUBLIC,
            },
            {
                createdBy: {
                    $in: user.friends,
                },
                privacy: PostPrivacyEnum.FRIENDS,
            },
            { tags: { $in: [user._id] } },
            { createdBy: user._id },
        ];
    }
}
export default new PostRepo();
