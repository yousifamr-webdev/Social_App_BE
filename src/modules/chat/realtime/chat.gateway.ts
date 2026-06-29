import type { Server } from "socket.io";
import type { SocketAuthType } from "../../../common/interfaces/express.interface.js";
import chatEvent from "./chat.event.js";

class ChatGateway {
  private _chatEvent = chatEvent;

  registerEvents(socket: SocketAuthType, io: Server) {
    this._chatEvent.getChatEvent(socket);
    this._chatEvent.sendMessageEvent(socket, io);
    this._chatEvent.sendGroupMessageEvent(socket, io);
        this._chatEvent.joinRoomEvent(socket, io);
  }
}

export default new ChatGateway();
