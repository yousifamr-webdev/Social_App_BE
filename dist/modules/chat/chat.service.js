import { Types } from "mongoose";
import chatRepo from "../../DB/Repo/chat.repo.js";
import { NotFoundException } from "../../common/exceptions/domain.exceptions.js";
import { ChatTypeEnum } from "../../common/enums/chat.enums.js";
import userRepo from "../../DB/Repo/user.repo.js";
import s3bucketService from "../../common/S3Bucket/s3bucket.service.js";
import { randomUUID } from "crypto";
class ChatService {
    _chatRepo = chatRepo;
    _userRepo = userRepo;
    _s3BucketService = s3bucketService;
    async getChat(participantId, user) {
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
    async sendMessage(bodyData, user) {
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
    async createGroup(participants, groupName, file, user) {
        const users = await this._userRepo.find({
            filter: {
                _id: { $in: participants },
            },
        });
        if (users.length != participants.length) {
            throw new NotFoundException("Failed to find all users.");
        }
        const roomId = randomUUID();
        let groupPath = "";
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
                    ...participants.map((participantId) => Types.ObjectId.createFromHexString(participantId)),
                ],
                createdBy: user._id,
                type: ChatTypeEnum.OVM,
                group: groupName,
                group_image: groupPath,
                roomId,
            },
        });
    }
    async getGroupChat(groupId, user) {
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
    async sendGroupMessage(bodyData, user) {
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
