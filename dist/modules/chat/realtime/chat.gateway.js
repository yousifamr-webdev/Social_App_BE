import chatEvent from "./chat.event.js";
class ChatGateway {
    _chatEvent = chatEvent;
    registerEvents(socket, io) {
        this._chatEvent.getChatEvent(socket);
        this._chatEvent.sendMessageEvent(socket, io);
        this._chatEvent.sendGroupMessageEvent(socket, io);
        this._chatEvent.joinRoomEvent(socket, io);
    }
}
export default new ChatGateway();
