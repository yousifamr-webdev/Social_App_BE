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
async function bootstrap() {
    const app = express();
    const port = PORT;
    await testDBConnection();
    await testRedisConnection();
    app.use(express.json());
    app.use(cors());
    app.get("/", (req, res, next) => {
        res.status(200).json({ msg: "Landing page." });
    });
    app.use("/auth", authController);
    app.use("/user", userController);
    app.get("/uploads/*path", async (req, res, next) => {
        const { path } = req.params;
        const { filename, download } = req.query;
        const Key = path.join("/");
        const result = await s3bucketService.getFile(Key);
        const pipelinePromise = promisify(pipeline);
        if (download == "true") {
            res.setHeader("content-disposition", `attachment; filename=${filename || path[path.length - 1]}`);
        }
        await pipelinePromise(result.Body, res);
    });
    app.use("/*dummy", (req, res, next) => {
        res.status(404).json({ msg: "Invalid URL or Method" });
    });
    app.use(globalErrHandlingMiddleware);
    app.listen(port, () => {
        console.log("App running on port 3000.");
    });
}
export default bootstrap;
