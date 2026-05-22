import { model, Schema, Types, type HydratedDocument } from "mongoose";
import { PostPrivacyEnum } from "../../common/enums/post.enum.js";

export interface IPost {
  content?: string;
  attachments?: string[];
  likes?: Types.ObjectId[];
  tags?: Types.ObjectId[];
  privacy: PostPrivacyEnum;
  createdBy: Types.ObjectId;
  deletedAt?: Date;
}

export type IHPost = HydratedDocument<IPost>;

const postSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      required: function (): boolean {
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
  },
  {
    timestamps: true,

    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

postSchema.pre(["findOne", "find", "countDocuments"], function () {
  const query = this.getQuery();

  if (!query.getSoftDelete) {
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});

postSchema.virtual("comments", {
  localField: "_id",
  foreignField: "postId",
  ref: "Comment",
  justOne: true,
});

const postModel = model<IPost>("Post", postSchema);

export default postModel;
