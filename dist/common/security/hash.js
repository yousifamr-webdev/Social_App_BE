import { hash, compare } from "bcrypt";
import { SALT } from "../../config/config.service.js";
export const generateHash = async ({ plainText, salt = SALT, }) => {
    return await hash(plainText, salt);
};
export const compareHash = async ({ plainText, cipherText, }) => {
    return await compare(plainText, cipherText);
};
