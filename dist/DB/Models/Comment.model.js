import { model, Schema, Types } from "mongoose";
import { PostPrivacyEnum } from "../../common/enums/post.enum.js";
const commentSchema = new Schema({
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: [String],
    likes: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: Types.ObjectId, ref: "User" }],
    postId: { type: Types.ObjectId, ref: "Post", required: true },
    commentId: { type: Types.ObjectId, ref: "Comment" },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    deletedAt: Date,
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
commentSchema.pre(["findOne", "find", "countDocuments"], function () {
    const query = this.getQuery();
    if (!query.getSoftDelete) {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
});
commentSchema.virtual("replies", {
    localField: "_id",
    foreignField: "commentId",
    ref: "Comment",
});
const commentModel = model("Comment", commentSchema);
export default commentModel;
