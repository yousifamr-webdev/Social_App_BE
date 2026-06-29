import { Types } from "mongoose";
import type { IHUser } from "../../DB/Models/User.model.js";
import chatRepo from "../../DB/Repo/chat.repo.js";
import { NotFoundException } from "../../common/exceptions/domain.exceptions.js";
import { ChatTypeEnum } from "../../common/enums/chat.enums.js";
import userRepo from "../../DB/Repo/user.repo.js";
import s3bucketService from "../../common/S3Bucket/s3bucket.service.js";
import { randomUUID } from "crypto";
class ChatService {
  private _chatRepo = chatRepo;
  private _userRepo = userRepo;
  private _s3BucketService = s3bucketService;

  async getChat(participantId: string, user: IHUser) {
    const chat = await this._chatRepo.findOne({
      filter: {
        participants: {
          $all: [user._id, Types.ObjectId.createFromHexString(participantId)],
        },
        type: ChatTypeEnum.OVO,
      },
      options: {
        populate: [{ path: "participants" }],
      },
    });

    if (!chat) {
      throw new NotFoundException("No Chat Found.");
    }
    return { chat };
  }

  async sendMessage(bodyData: any, user: IHUser) {
    const { content, sendTo } = bodyData;

    const chat = await this._chatRepo.findOneAndUpdate({
      filter: {
        participants: {
          $all: [user._id, Types.ObjectId.createFromHexString(sendTo)],
        },
        type: ChatTypeEnum.OVO,
      },
      update: {
        $push: {
          messages: {
            content,
            createdBy: user._id,
          },
        },
      },
    });

    if (!chat) {
      await this._chatRepo.create({
        data: {
          participants: [user._id, Types.ObjectId.createFromHexString(sendTo)],
          messages: [
            {
              content,
              createdBy: user._id,
            },
          ],
          createdBy: user._id,
          type: ChatTypeEnum.OVO,
        },
      });
    }
  }

  async createGroup(
    participants: string[],
    groupName: string,
    file: Express.Multer.File,
    user: IHUser,
  ) {
    const users = await this._userRepo.find({
      filter: {
        _id: { $in: participants },
      },
    });

    if (users.length != participants.length) {
      throw new NotFoundException("Failed to find all users.");
    }

    const roomId = randomUUID();

    let groupPath: string = "";

    if (file) {
      groupPath = await this._s3BucketService.uploadFile({
        file,
        path: `chat/group/${roomId}`,
      });
    }

    await this._chatRepo.create({
      data: {
        participants: [
          user._id,
          ...participants.map((participantId) =>
            Types.ObjectId.createFromHexString(participantId),
          ),
        ],

        createdBy: user._id,
        type: ChatTypeEnum.OVM,
        group: groupName,
        group_image: groupPath,
        roomId,
      },
    });
  }

  async getGroupChat(groupId: string, user: IHUser) {
    const chat = await this._chatRepo.findOne({
      filter: {
        _id: groupId,
        participants: {
          $all: [user._id],
        },
        type: ChatTypeEnum.OVM,
      },
      options: {
        populate: [{ path: "participants" }],
      },
    });

    if (!chat) {
      throw new NotFoundException("No Group chat Found.");
    }
    return { chat };
  }

  async sendGroupMessage(bodyData: any, user: IHUser) {
    const { content, groupId } = bodyData;

    const chat = await this._chatRepo.findOneAndUpdate({
      filter: {
        _id: groupId,
        participants: {
          $all: [user._id],
        },
        type: ChatTypeEnum.OVM,
      },
      update: {
        $push: {
          messages: {
            content,
            createdBy: user._id,
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException("No group found.");
    }

    return chat.roomId;
  }
}

export default new ChatService();
