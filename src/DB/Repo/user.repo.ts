import type { ObjectId } from "mongoose";
import type { IUser } from "../Models/User.model.js";
import userModel from "../Models/User.model.js";
import DBRepo from "./db.repo.js";

class UserRepo extends DBRepo<IUser> {
  constructor() {
    super(userModel);
  }

  async checkUserExists(id: ObjectId): Promise<boolean> {
    return (await this.findOne({ filter: { _id: id } })) != null;
  }
}

export default new UserRepo();
