import express from "express";
import authController from "./modules/auth/auth.controller.js";
import path from "path";
import globalErrHandlingMiddleware from "./Middlewares/globalErr.middleware.js";
import { PORT } from "./config/config.service.js";
import testDBConnection from "./DB/connection.js";
import { testRedisConnection } from "./DB/Redis/redis.connection.js";
import userController from "./modules/user/user.controller.js";
async function bootstrap() {
    const app = express();
    const port = PORT;
    await testDBConnection();
    await testRedisConnection();
    app.use(express.json());
    app.get("/", (req, res, next) => {
        res.status(200).json({ msg: "Landing page." });
    });
    app.use("/auth", authController);
    app.use("/user", userController);
    app.use("/*dummy", (req, res, next) => {
        res.status(404).json({ msg: "Invalid URL or Method" });
    });
    app.use(globalErrHandlingMiddleware);
    app.listen(port, () => {
        console.log("App running on port 3000.");
    });
}
export default bootstrap;
