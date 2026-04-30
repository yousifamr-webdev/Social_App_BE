import RedisService from "../../DB/Redis/redis.service.js";
import { OTPEnum } from "../enums/otp.enum.js";
import { BadRequestException } from "../exceptions/domain.exceptions.js";
import { generateHash } from "../security/hash.js";
import { generateOTP } from "../security/otp.js";
import { sendEmail } from "./email.config.js";
class MailService {
    _redisMethods = RedisService;
    OTP_EXPIRE = 300;
    MAX_ATTEMPTS = 5;
    BLOCK_TIME = this.OTP_EXPIRE * 2;
    async _handleOtp({ email, otpType, subject, enforceCooldown = true, }) {
        const otpKey = this._redisMethods.getOTPKey({ email, otpType });
        const blockKey = this._redisMethods.getOTPBlockedStatusKey({
            email,
            otpType,
        });
        const reqKey = this._redisMethods.getOTPReqNoKey({ email, otpType });
        if (enforceCooldown) {
            const ttl = await this._redisMethods.ttl(otpKey);
            if (ttl > 0) {
                throw new BadRequestException(`Wait ${ttl}s before requesting another OTP.`);
            }
        }
        const blockedTTL = await this._redisMethods.ttl(blockKey);
        if (blockedTTL > 0) {
            throw new BadRequestException(`Too many attempts. Try again in ${blockedTTL}s.`);
        }
        const otp = generateOTP();
        const hashedOTP = await generateHash({ plainText: otp });
        await this._redisMethods.set({
            key: otpKey,
            value: hashedOTP,
            exValue: this.OTP_EXPIRE,
        });
        const attempts = await this._redisMethods.incr(reqKey);
        if (attempts === 1) {
            await this._redisMethods.setExpire({
                key: reqKey,
                exValue: this.OTP_EXPIRE * 5,
            });
        }
        if (attempts >= this.MAX_ATTEMPTS) {
            await this._redisMethods.set({
                key: blockKey,
                value: 1,
                exValue: this.BLOCK_TIME,
            });
        }
        await sendEmail({
            to: email,
            subject,
            html: `<h2>Your verification code is ${otp}</h2>
             <p>This code expires in 5 minutes.</p>`,
        });
    }
    async sendConfirmEmail(user) {
        await this._handleOtp({
            email: user.email,
            otpType: OTPEnum.confirmEmail,
            subject: "Email confirmation",
            enforceCooldown: true,
        });
    }
    async sendLoginOtp(user) {
        if (!user.twoStepVerification)
            return;
        await this._handleOtp({
            email: user.email,
            otpType: OTPEnum.Login,
            subject: "2-Step Login",
        });
        return { msg: "Please check your email." };
    }
    async checkLoginBlock(user) {
        const blockTTL = await this._redisMethods.ttl(this._redisMethods.getOTPBlockedStatusKey({
            email: user.email,
            otpType: OTPEnum.Login,
        }));
        if (blockTTL > 0) {
            throw new BadRequestException(`Too many attempts. Try again in ${blockTTL}s.`);
        }
    }
    async sendForgetPassword(email) {
        await this._handleOtp({
            email,
            otpType: OTPEnum.forgetPassword,
            subject: "Reset your password",
            enforceCooldown: true,
        });
    }
}
export default new MailService();
