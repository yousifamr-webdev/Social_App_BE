import { Server, type ExtendedError } from "socket.io";
import { Server as httpServer } from "http";
import tokenService from "../../common/security/token.service.js";
import type { SocketAuthType } from "../../common/interfaces/express.interface.js";
import z from "zod";
import { validationRealtime } from "../../Middlewares/validation.middleware.js";
import chatEvent from "../chat/realtime/chat.event.js";
import chatGateway from "../chat/realtime/chat.gateway.js";
import redisService from "../../DB/Redis/redis.service.js";

class RealtimeGateway {
  private _tokenService = tokenService;
  private _chatGateway = chatGateway;
  private _redisService = redisService;

  authentication = async (
    socket: SocketAuthType,
    next: (err?: ExtendedError) => void,
  ) => {
    try {
      const { user, verifiedToken } = await this._tokenService.checkToken(
        socket.handshake.auth.authorization,
      );
      socket.data = { user, verifiedToken };

      await this._redisService.addSocketIoIdToSet(user._id, socket.id);

      next();
    } catch (error) {
      next(error as ExtendedError);
    }
  };

  initializeIO(server: httpServer) {
    const io = new Server(server, { cors: { origin: "*" } });

    io.use(this.authentication);

    io.on("connection", async (socket: SocketAuthType) => {
   

      this._chatGateway.registerEvents(socket,io);

      socket.on("disconnect", async () => {
        await this._redisService.removeSocketId(
          socket.data.user._id,
          socket.id,
        );
      });
    });
  }
}

export default new RealtimeGateway();
