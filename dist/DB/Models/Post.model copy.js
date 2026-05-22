import { model, Schema, Types } from "mongoose";
import { PostPrivacyEnum } from "../../common/enums/post.enum.js";
const postSchema = new Schema({
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: [String],
    likes: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: Types.ObjectId, ref: "User" }],
    privacy: {
        type: Number,
        enum: PostPrivacyEnum,
        default: PostPrivacyEnum.PUBLIC,
    },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    deletedAt: Date,
}, {
    timestamps: true,
    strictQuery: true,
});
postSchema.pre(["findOne", "find", "countDocuments"], function () {
    const query = this.getQuery();
    if (!query.getSoftDelete) {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
});
const postModel = model("Post", postSchema);
export default postModel;
