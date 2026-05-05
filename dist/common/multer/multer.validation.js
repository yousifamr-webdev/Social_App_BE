import { BadRequestException } from "../exceptions/domain.exceptions.js";
export const allowedFileFormats = {
    img: ["image/png", "image/jpg"],
    video: ["video/mp4"],
    pdf: ["application/pdf"],
};
export function fileFilter(allowedFormat) {
    return (req, file, cb) => {
        if (!allowedFormat.includes(file.mimetype)) {
            return cb(new BadRequestException("invalid format"));
        }
        return cb(null, true);
    };
}
