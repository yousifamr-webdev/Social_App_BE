import type { FileFilterCallback } from "multer";
import { BadRequestException } from "../exceptions/domain.exceptions.js";
import type { Request } from "express";

export const allowedFileFormats = {
  img: ["image/png", "image/jpg"],
  video: ["video/mp4"],
  pdf: ["application/pdf"],
};

export function fileFilter(allowedFormat: string[]) {
  return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!allowedFormat.includes(file.mimetype)) {
      return cb(new BadRequestException("invalid format"));
    }
    return cb(null, true);
  };
}
