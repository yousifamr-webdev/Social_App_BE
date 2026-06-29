import DBRepo from "./db.repo.js";
import type { IChat } from "../Models/Chat.model.js";
import chatModel from "../Models/Chat.model.js";

class ChatRepo extends DBRepo<IChat> {
  constructor() {
    super(chatModel);
  }




}

export default new ChatRepo();
