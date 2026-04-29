import CryptoJS from "crypto-js";
import { ENCRYPTION_KEY } from "../../config/config.service.js";
export function encryptValue({ value, key = ENCRYPTION_KEY, }) {
    return CryptoJS.AES.encrypt(value, key).toString();
}
export function decryptValue({ cipherText, key = ENCRYPTION_KEY, }) {
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
}
