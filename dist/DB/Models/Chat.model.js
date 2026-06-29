import { model, Schema, Types } from "mongoose";
import { PostPrivacyEnum } from "../../common/enums/post.enum.js";
import { ChatTypeEnum } from "../../common/enums/chat.enums.js";
const messageSchema = new Schema({
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: [String],
    likes: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: Types.ObjectId, ref: "User" }],
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    deletedAt: Date,
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
});
const chatSchema = new Schema({
    participants: [{ type: Types.ObjectId, ref: "User", required: true }],
    messages: [messageSchema],
    type: {
        type: String,
        enum: ChatTypeEnum,
        default: ChatTypeEnum.OVO,
    },
    group: {
        type: String,
        required: function () {
            return this.type == ChatTypeEnum.OVM;
        },
    },
    group_image: {
        type: String,
        required: function () {
            return this.type == ChatTypeEnum.OVM;
        },
    },
    roomId: {
        type: String,
        required: function () {
            return this.type == ChatTypeEnum.OVM;
        },
    },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    deletedAt: Date,
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
});
chatSchema.pre(["findOne", "find", "countDocuments"], function () {
    const query = this.getQuery();
    if (!query.getSoftDelete) {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
});
chatSchema.virtual("comments", {
    localField: "_id",
    foreignField: "postId",
    ref: "Comment",
    justOne: true,
});
const chatModel = model("Chat", chatSchema);
export default chatModel;
