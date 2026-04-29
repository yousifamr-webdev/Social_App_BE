import type { NextFunction, Request, Response } from "express";

interface IError extends Error {
  statusCode?: number;
}

export function globalErrHandlingMiddleware(
  err: IError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
