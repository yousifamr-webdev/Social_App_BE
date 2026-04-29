import { hash, compare } from "bcrypt";
import { SALT } from "../../config/config.service.js";

export const generateHash = async ({
  plainText,
  salt = SALT,
}: {
  plainText: string;
  salt?: number;
}) => {
  return await hash(plainText, salt);
};

export const compareHash = async ({
  plainText,
  cipherText,
}: {
  plainText: string;
  cipherText: string;
}) => {
  return await compare(plainText, cipherText);
};
