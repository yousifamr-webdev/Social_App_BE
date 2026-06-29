import DBRepo from "./db.repo.js";
import chatModel from "../Models/Chat.model.js";
class ChatRepo extends DBRepo {
    constructor() {
        super(chatModel);
    }
}
export default new ChatRepo();
