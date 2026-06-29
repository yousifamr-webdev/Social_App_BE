import express from "express";
import authController from "./modules/auth/auth.controller.js";
import path from "path";
import globalErrHandlingMiddleware from "./Middlewares/globalErr.middleware.js";
import { PORT } from "./config/config.service.js";
import testDBConnection from "./DB/connection.js";
import { testRedisConnection } from "./DB/Redis/redis.connection.js";
import userController from "./modules/user/user.controller.js";
import cors from "cors";
import s3bucketService from "./common/S3Bucket/s3bucket.service.js";
import { promisify } from "util";
import { pipeline } from "node:stream";
import successResponse from "./common/response/success.response.js";
import postController from "./modules/post/post.controller.js";
import commentController from "./modules/comment/comment.controller.js";
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import { createHandler } from "graphql-http/lib/use/express";
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "./common/enums/user.enums.js";
import userRepo from "./DB/Repo/user.repo.js";
import schema from "./modules/gql/schema.gql.js";
import { authentication } from "./Middlewares/authentication.middleware.js";
import { Server, type ExtendedError } from "socket.io";
import tokenService from "./common/security/token.service.js";
import type { SocketAuthType } from "./common/interfaces/express.interface.js";
import z from "zod";
import { validationRealtime } from "./Middlewares/validation.middleware.js";
import realtimeGateway from "./modules/realtime/realtime.gateway.js";
import chatController from "./modules/chat/chat.controller.js";

async function bootstrap() {
  const app: express.Express = express();
  const port = PORT;

  await testDBConnection();
  await testRedisConnection();

  app.use(express.json());
  app.use(cors());

  app.get(
    "/",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ): void => {
      res.status(200).json({ msg: "Landing page." });
    },
  );

  app.all(
    "/graphql",
    authentication(),
    createHandler({
      schema: schema,
      context: (req) => ({
        user: req.raw.user,
        tokenPayload: req.raw.tokenPayload,
      }),
    }),
  );

  app.use("/auth", authController);
  app.use("/user", userController);
  app.use("/post", postController);
  app.use("/chat", chatController);
  app.use("/comment", commentController);

  app.get("/uploads/*path", async (req, res, next) => {
    const { path } = req.params;
    const { filename, download } = req.query;

    const Key = path.join("/");
    const result = await s3bucketService.getFile(Key);

    const pipelinePromise = promisify(pipeline);

    if (download == "true") {
      res.setHeader(
        "content-disposition",
        `attachment; filename=${filename || path[path.length - 1]}`,
      );
    }

    await pipelinePromise(result.Body as NodeJS.ReadableStream, res);
  });

  app.get("/pre-signed-upload/*path", async (req, res, next) => {
    const { path } = req.params;
    const { filename, download } = req.query;

    const Key = path.join("/");
    const result = await s3bucketService.createPreSignedGetFile({
      Key,
      filename: (filename as string) || (path[path.length - 1] as string),
      download: download as string,
    });

    return successResponse({ res, data: result });
  });

  app.use(
    "/*dummy",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ): void => {
      res.status(404).json({ msg: "Invalid URL or Method" });
    },
  );

  app.use(globalErrHandlingMiddleware);

  const server = app.listen(port, () => {
    console.log("App running on port 3000.");
  });


realtimeGateway.initializeIO(server)

}

export default bootstrap;
