import DBRepo from "./db.repo.js";
import type { IComment } from "../Models/Comment.model.js";
import commentModel from "../Models/Comment.model.js";

class CommentRepo extends DBRepo<IComment> {
  constructor() {
    super(commentModel);
  }




}

export default new CommentRepo();
