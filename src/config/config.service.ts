import dotenv from "dotenv";
import path from "path";

export const NODE_ENV = process.env.NODE_ENV;

dotenv.config({ path: path.resolve("./.env.dev") });

export const PORT = process.env.PORT || 5000;
export const DB_URI_ATLAS = process.env.DB_URI_ATLAS as string;
export const DB_URI_LOCAL = process.env.DB_URI_LOCAL as string;
export const SALT = parseInt(process.env.SALT as string);
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;
export const TOKEN_SIGNATURE_User_ACCESS = process.env
  .TOKEN_SIGNATURE_User_ACCESS as string;
export const TOKEN_SIGNATURE_Admin_ACCESS = process.env
  .TOKEN_SIGNATURE_Admin_ACCESS as string;
export const TOKEN_SIGNATURE_User_REFRESH = process.env
  .TOKEN_SIGNATURE_User_REFRESH as string;
export const TOKEN_SIGNATURE_Admin_REFRESH = process.env
  .TOKEN_SIGNATURE_Admin_REFRESH as string;

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;

export const EMAIL_USER = process.env.EMAIL_USER as string;
export const EMAIL_PASS = process.env.EMAIL_PASS as string;

export const REDIS_URL = process.env.REDIS_URL as string;
