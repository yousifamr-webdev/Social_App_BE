import z from "zod";
import { validationRealtime } from "../../../Middlewares/validation.middleware.js";
import { testSchema } from "../chat.validation.js";
import chatService from "../chat.service.js";
import redisService from "../../../DB/Redis/redis.service.js";
class ChatEvent {
    _chatService = chatService;
    _redisService = redisService;
    getChatEvent(socket) {
        return socket.on("getChat", async (args) => {
            validationRealtime(testSchema, args);
        });
    }
    sendMessageEvent(socket, io) {
        return socket.on("sendMessage", async (args) => {
            await this._chatService.sendMessage(args, socket.data.user);
            const socketIds = await this._redisService.getMemberSocketIoId(socket.data.user._id);
            io.to(socketIds).emit("successMessage", args);
            const socketIdsAnotherUser = await this._redisService.getMemberSocketIoId(args.sendTo);
            if (socketIdsAnotherUser.length) {
                io.to(socketIds).emit("newMessage", {
                    content: args.content,
                    from: socket.data.user,
                });
            }
        });
    }
    sendGroupMessageEvent(socket, io) {
        return socket.on("sendGroupMessage", async (args) => {
            const roomId = await this._chatService.sendGroupMessage(args, socket.data.user);
            const socketIds = await this._redisService.getMemberSocketIoId(socket.data.user._id);
            io.to(socketIds).emit("successMessage", {
                content: args.content,
                sendTo: args.groupId,
            });
            io.to(roomId).emit("newMessage", {
                content: args.content,
                from: socket.data.user,
                groupId: args.groupId,
            });
        });
    }
    joinRoomEvent(socket, io) {
        return socket.on("join_room", async (args) => {
            socket.join(args.roomId);
        });
    }
}
export default new ChatEvent();
