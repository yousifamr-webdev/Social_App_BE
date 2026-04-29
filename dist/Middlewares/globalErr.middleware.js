export function globalErrHandlingMiddleware(err, req, res, next) {
    const statusCode = err.statusCode ?? 500;
    if (!err.statusCode) {
        console.log("ERROR:");
        console.log("Type:", err.constructor.name);
        console.log("Status:", err.statusCode);
        console.log("Message:", err.message);
        console.log("Stack:", err.stack);
    }
    res.status(statusCode).json({
        errMsg: err.message || "Internal Server Error",
        stack: err.stack,
        err,
        cause: err.cause,
    });
}
export default globalErrHandlingMiddleware;
