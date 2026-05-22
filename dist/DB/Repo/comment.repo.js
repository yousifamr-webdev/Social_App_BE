import DBRepo from "./db.repo.js";
import commentModel from "../Models/Comment.model.js";
class CommentRepo extends DBRepo {
    constructor() {
        super(commentModel);
    }
}
export default new CommentRepo();
