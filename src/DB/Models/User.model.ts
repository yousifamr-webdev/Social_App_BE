import { Schema, model, connect, type HydratedDocument } from "mongoose";
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../../common/enums/user.enums.js";

export interface IUser {
  userName: string;
  email: string;
  password: string;
  provider: ProviderEnum;
  confirmEmail: boolean;
  coverPics: string[];
  age: number;
  phone: string;
  gender: GenderEnum;
  role: RoleEnum;
  changeCreditTime: Date;
  twoStepVerification: Boolean;
}

export type IHUser = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>({
  userName: { type: String, required: true },
  email: { type: String, required: true },
  password: {
    type: String,
    required: function (): boolean {
      return this.provider == ProviderEnum.System;
    },
  },
  provider: { type: Number, enum: ProviderEnum, default: ProviderEnum.System },
  confirmEmail: { type: Boolean, default: false },
  coverPics: [String],
  age: Number,
  phone: String,
  gender: { type: Number, enum: GenderEnum, default: GenderEnum.Male },
  role: { type: Number, enum: RoleEnum, default: RoleEnum.User },
  changeCreditTime: Date,
  twoStepVerification: { type: Boolean, default: false },
});

const userModel = model<IUser>("User", userSchema);

export default userModel;
