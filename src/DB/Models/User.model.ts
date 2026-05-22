import { Schema, model, connect, type HydratedDocument, Types } from "mongoose";
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../../common/enums/user.enums.js";
import MailService from "../../common/email/email.service.js";
import { encryptValue } from "../../common/security/encrypt.js";
import { generateHash } from "../../common/security/hash.js";

export interface IUser {
  userName: string;
  email: string;
  password: string;
  provider: ProviderEnum;
  confirmEmail: boolean;
  profilePic: string;
  coverPics: string[];
  age: number;
  phone: string;
  gender: GenderEnum;
  role: RoleEnum;
  changeCreditTime: Date;
  deletedAt: Date;
  twoStepVerification: Boolean;
  friends: Types.ObjectId[];
}

export type IHUser = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true },
    email: { type: String, required: true },
    password: {
      type: String,
      required: function (): boolean {
        return this.provider == ProviderEnum.System;
      },
    },
    provider: {
      type: Number,
      enum: ProviderEnum,
      default: ProviderEnum.System,
    },
    confirmEmail: { type: Boolean, default: false },
    profilePic: String,
    coverPics: [String],
    age: Number,
    phone: String,
    gender: { type: Number, enum: GenderEnum, default: GenderEnum.Male },
    role: { type: Number, enum: RoleEnum, default: RoleEnum.User },
    changeCreditTime: Date,
    deletedAt: Date,
    twoStepVerification: { type: Boolean, default: false },
    friends: [{ type: Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
    strictQuery: true,
  },
);

userSchema.index({ confirmEmailExpires: 1 }, { expireAfterSeconds: 0 });

userSchema.pre("save", async function (this: IHUser & { wasNew: boolean }) {
  this.wasNew = this.isNew;

  if (this.isModified("password")) {
    this.password = await generateHash({
      plainText: this.password,
    });
  }

  if (this.phone && this.isModified("phone")) {
    this.phone = encryptValue({ value: this.phone });
  }
});

userSchema.post("save", async function (this: IHUser & { wasNew: boolean }) {
  this.wasNew = this.isNew;

  try {
    if (this.wasNew) {
      await MailService.sendConfirmEmail(this);
    }
  } catch (err) {
    console.log(err);
  }
});

userSchema.pre(["findOne", "find"], function () {
  const query = this.getQuery();

  if (!query.getSoftDelete) {
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});

const userModel = model<IUser>("User", userSchema);

export default userModel;
