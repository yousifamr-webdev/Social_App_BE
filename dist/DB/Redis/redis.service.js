import { client } from "./redis.connection.js";
class RedisService {
    blackListTokenKey({ userId, tokenId }) {
        return `blackLisToken::${userId}::${tokenId}`;
    }
    getOTPKey({ email, otpType }) {
        return `OTP::${email}::${otpType}`;
    }
    getOTPReqNoKey({ email, otpType }) {
        return `OTP::${email}::${otpType}::No`;
    }
    getOTPBlockedStatusKey({ email, otpType, }) {
        return `OTP::${email}::${otpType}::Blocked`;
    }
    async set({ key, value, exType = "EX", exValue = 30, }) {
        return await client.set(key, value, {
            expiration: { type: exType, value: Math.floor(exValue) },
        });
    }
    async get(key) {
        return await client.get(key);
    }
    async incr(key) {
        return await client.incr(key);
    }
    async decr(key) {
        return await client.decr(key);
    }
    async mget(keys) {
        return await client.mGet(keys);
    }
    async ttl(key) {
        return await client.ttl(key);
    }
    async exists(key) {
        return await client.exists(key);
    }
    async persists(key) {
        return await client.persist(key);
    }
    async del(key) {
        return await client.del(key);
    }
    async update(key, value) {
        if (!(await this.exists(key))) {
            return 0;
        }
        await client.set(key, value);
        return 1;
    }
    async setExpire({ key, exType = "EX", exValue = 30, }) {
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
