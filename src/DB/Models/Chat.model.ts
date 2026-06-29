import { model, Schema, Types, type HydratedDocument } from "mongoose";
import { PostPrivacyEnum } from "../../common/enums/post.enum.js";
import { ChatTypeEnum } from "../../common/enums/chat.enums.js";

export interface IMessage {
  content?: string;
  attachments?: string[];
  likes?: Types.ObjectId[];
  tags?: Types.ObjectId[];
  privacy: PostPrivacyEnum;
  createdBy: Types.ObjectId;
  deletedAt?: Date;
}

export interface IChat {
  participants: Types.ObjectId[];

  messages: IMessage[];
  type: ChatTypeEnum;

  group: string;
  group_image: string;
  roomId: string;

  createdBy: Types.ObjectId;
  deletedAt?: Date;
}

export type IHChat = HydratedDocument<IChat>;

const messageSchema = new Schema<IMessage>(
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

    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    deletedAt: Date,
  },
  {
    timestamps: true,

    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

const chatSchema = new Schema<IChat>(
  {
    participants: [{ type: Types.ObjectId, ref: "User", required: true }],

    messages: [messageSchema],
    type: {
      type: String,
      enum: ChatTypeEnum,
      default: ChatTypeEnum.OVO,
    },

    group: {
      type: String,
      required: function (): boolean {
        return this.type == ChatTypeEnum.OVM;
      },
    },
    group_image: {
      type: String,
      required: function (): boolean {
        return this.type == ChatTypeEnum.OVM;
      },
    },
    roomId: {
      type: String,
      required: function (): boolean {
        return this.type == ChatTypeEnum.OVM;
      },
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

const chatModel = model<IChat>("Chat", chatSchema);

export default chatModel;
