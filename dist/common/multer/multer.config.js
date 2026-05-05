import multer from "multer";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { StorageApproachEnum } from "../enums/multer.enums.js";
import { allowedFileFormats, fileFilter } from "./multer.validation.js";
export function cloudUpload({ storageApproach = StorageApproachEnum.Memory, allowedFormat = allowedFileFormats.img, fileSize = 5, }) {
    const storage = storageApproach == StorageApproachEnum.Memory
        ? multer.memoryStorage()
        : multer.diskStorage({
            destination(req, file, callback) {
                callback(null, tmpdir());
            },
            filename(req, file, callback) {
                callback(null, `${randomUUID()}_${file.originalname}`);
            },
        });
    return multer({
        storage,
        fileFilter: fileFilter(allowedFormat),
        limits: { fileSize: fileSize * 1024 * 1024 },
    });
}
