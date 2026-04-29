import type { OTPEnum } from "../../common/enums/otp.enum.js";
import { client } from "./redis.connection.js";

class RedisService {
  blackListTokenKey({ userId, tokenId }: { userId: string; tokenId: string }) {
    return `blackLisToken::${userId}::${tokenId}`;
  }

  getOTPKey({ email, otpType }: { email: string; otpType: OTPEnum }) {
    return `OTP::${email}::${otpType}`;
  }
  getOTPReqNoKey({ email, otpType }: { email: string; otpType: OTPEnum }) {
    return `OTP::${email}::${otpType}::No`;
  }

  getOTPBlockedStatusKey({
    email,
    otpType,
  }: {
    email: string;
    otpType: OTPEnum;
  }) {
    return `OTP::${email}::${otpType}::Blocked`;
  }

  async set({
    key,
    value,
    exType = "EX",
    exValue = 30,
  }: {
    key: string;
    value: number | string;
    exType?: "EX" | "PX" | "EXAT" | "PXAT";
    exValue?: number;
  }) {
    return await client.set(key, value, {
      expiration: { type: exType, value: Math.floor(exValue) },
    });
  }

  async get(key: string):Promise<string | number | null> {
    return await client.get(key);
  }

  async incr(key: string) {
    return await client.incr(key);
  }

  async decr(key: string) {
    return await client.decr(key);
  }

  async mget(keys: [string]) {
    return await client.mGet(keys);
  }

  async ttl(key: string) {
    return await client.ttl(key);
  }

  async exists(key: string) {
    return await client.exists(key);
  }
  async persists(key: string) {
    return await client.persist(key);
  }
  async del(key: string) {
    return await client.del(key);
  }

  async update(key: string, value: number) {
    if (!(await this.exists(key))) {
      return 0;
    }
    await client.set(key, value);
    return 1;
  }

  async setExpire({
    key,
    exType = "EX",
    exValue = 30,
  }: {
    key: string;
    exType?: "EX" | "PX" | "EXAT" | "PXAT";
    exValue?: number;
  }) {
    const value = Math.floor(exValue);

    if (exType === "EX") {
      return await client.expire(key, value);
    }

    if (exType === "PX") {
      return await client.pExpire(key, value);
    }

    throw new Error("Invalid expiration type. Use 'EX' or 'PX'");
  }
}

export default new RedisService();
