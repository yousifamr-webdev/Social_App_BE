import type { IHUser } from "../../DB/Models/User.model.js";
import RedisService from "../../DB/Redis/redis.service.js";
import { OTPEnum } from "../enums/otp.enum.js";
import { BadRequestException } from "../exceptions/domain.exceptions.js";
import { generateHash } from "../security/hash.js";
import { generateOTP } from "../security/otp.js";
import { sendEmail } from "./email.config.js";

type SendOtpOptions = {
  email: string;
  otpType: OTPEnum;
  subject: string;
  enforceCooldown?: boolean;
};

class MailService {
  private _redisMethods = RedisService;

  private readonly OTP_EXPIRE = 300;
  private readonly MAX_ATTEMPTS = 5;
  private readonly BLOCK_TIME = this.OTP_EXPIRE * 2;

  //  Centralized OTP Flow
  private async _handleOtp({
    email,
    otpType,
    subject,
    enforceCooldown = true,
  }: SendOtpOptions) {
    const otpKey = this._redisMethods.getOTPKey({ email, otpType });
    const blockKey = this._redisMethods.getOTPBlockedStatusKey({
      email,
      otpType,
    });
    const reqKey = this._redisMethods.getOTPReqNoKey({ email, otpType });

    //  Cooldown check
    if (enforceCooldown) {
      const ttl = await this._redisMethods.ttl(otpKey);
      if (ttl > 0) {
        throw new BadRequestException(
          `Wait ${ttl}s before requesting another OTP.`,
        );
      }
    }

    //  Block check
    const blockedTTL = await this._redisMethods.ttl(blockKey);
    if (blockedTTL > 0) {
      throw new BadRequestException(
        `Too many attempts. Try again in ${blockedTTL}s.`,
      );
    }

    //  Generate OTP
    const otp = generateOTP();
    const hashedOTP = await generateHash({ plainText: otp });

    //  Store OTP
    await this._redisMethods.set({
      key: otpKey,
      value: hashedOTP,
      exValue: this.OTP_EXPIRE,
    });

    //  Increment attempts
    const attempts = await this._redisMethods.incr(reqKey);

    // Set expiry for attempts if first time
    if (attempts === 1) {
      await this._redisMethods.setExpire({
        key: reqKey,
        exValue: this.OTP_EXPIRE * 5,
      });
    }

    //  Block if max reached
    if (attempts >= this.MAX_ATTEMPTS) {
      await this._redisMethods.set({
        key: blockKey,
        value: 1,
        exValue: this.BLOCK_TIME,
      });
    }

    //  Send email
    await sendEmail({
      to: email,
      subject,
      html: `<h2>Your verification code is ${otp}</h2>
             <p>This code expires in 5 minutes.</p>`,
    });
  }

  //  Public APIs

  public async sendConfirmEmail(user: IHUser) {
    await this._handleOtp({
      email: user.email,
      otpType: OTPEnum.confirmEmail,
      subject: "Email confirmation",
      enforceCooldown: true,
    });
  }

  public async sendLoginOtp(user: IHUser) {
    if (!user.twoStepVerification) return;

    await this._handleOtp({
      email: user.email,
      otpType: OTPEnum.Login,
      subject: "2-Step Login",
    });

    return { msg: "Please check your email." };
  }

  public async checkLoginBlock(user: IHUser) {
    const blockTTL = await this._redisMethods.ttl(
      this._redisMethods.getOTPBlockedStatusKey({
        email: user.email,
        otpType: OTPEnum.Login,
      }),
    );

    if (blockTTL > 0) {
      throw new BadRequestException(
        `Too many attempts. Try again in ${blockTTL}s.`,
      );
    }
  }
}

export default new MailService();
