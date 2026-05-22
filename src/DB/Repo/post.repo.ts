import type { ObjectId, Types } from "mongoose";
import type { IPost } from "../Models/Post.model.js";
import DBRepo from "./db.repo.js";
import postModel from "./../Models/Post.model.js";
import type { IHUser } from "../Models/User.model.js";
import { PostPrivacyEnum } from "../../common/enums/post.enum.js";

class PostRepo extends DBRepo<IPost> {
  constructor() {
    super(postModel);
  }



   checkPostPrivacy(user: IHUser) {
    return [
      {
        privacy: PostPrivacyEnum.PUBLIC,
      },
      {
        createdBy: {
          $in: user.friends as Types.ObjectId[],
        },
        privacy: PostPrivacyEnum.FRIENDS,
      },
      { tags: { $in: [user._id] } },
      { createdBy: user._id },
    ];
  }
}

export default new PostRepo();
