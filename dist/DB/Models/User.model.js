import { Schema, model, connect } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum, } from "../../common/enums/user.enums.js";
const userSchema = new Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true },
    password: {
        type: String,
        required: function () {
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
const userModel = model("User", userSchema);
export default userModel;
