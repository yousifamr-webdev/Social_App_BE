import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/exceptions/domain.exceptions.js";

import { encryptValue } from "../../common/security/encrypt.js";
import { compareHash, generateHash } from "../../common/security/hash.js";
import tokenService from "../../common/security/token.service.js";
import { ENCRYPTION_KEY } from "../../config/config.service.js";
import type { IHUser } from "../../DB/Models/User.model.js";

import UserRepo from "../../DB/Repo/user.repo.js";
import type {
  LoginDto,
  resendEmailVerficationDto,
  SignupDto,
  verifyEmailDto,
} from "./auth.dto.js";
import CryptoJS from "crypto-js";
import MailService from "../../common/email/email.service.js";
import RedisService from "../../DB/Redis/redis.service.js";
import { OTPEnum } from "../../common/enums/otp.enum.js";
import userModel from "../../DB/Models/User.model.js";
import { sendEmail } from "../../common/email/email.config.js";

class AuthService {
  private _userRepo = UserRepo;
  private _tokenService = tokenService;
  private _mailService = MailService;
  private _redisMethods = RedisService;

  public async signup(bodyData: SignupDto): Promise<IHUser> {
    const { email, password, phone } = bodyData;
    const isEmail = await this._userRepo.findOne({ filter: { email } });
    if (isEmail) {
      throw new ConflictException("Email already exists.");
    }

    bodyData.password = await generateHash({
      plainText: password,
    });

    if (phone) {
      bodyData.phone = encryptValue({ value: phone });
    }

    const [user] = await this._userRepo.create({ data: [bodyData] });

    if (user) {
      await this._mailService.sendConfirmEmail(user);
    } else {
      throw new BadRequestException("Failed to create user.");
    }

    return user;
  }
  public async login(bodyData: LoginDto) {
    const { email, password } = bodyData;

    const user = await this._userRepo.findOne({
      filter: { email },
    });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    if (!user.confirmEmail) {
      throw new NotFoundException("Please confirm your email first.");
    }

    await this._mailService.checkLoginBlock(user);

    const isPasswordValid = await compareHash({
      plainText: password,
      cipherText: user.password,
    });

    if (!isPasswordValid) throw new BadRequestException("Invalid password.");

    await this._mailService.sendLoginOtp(user);

    const bytes = CryptoJS.AES.decrypt(user.phone, ENCRYPTION_KEY);

    const originalPhone = bytes.toString(CryptoJS.enc.Utf8);

    user.phone = originalPhone;

    const { access_token, refresh_token } =
      this._tokenService.generateAccessAndRefreshTokens({
        role: user.role,
        sub: String(user._id),
      });

    return { access_token, refresh_token };
  }

  public async verifyEmail(bodyData: verifyEmailDto) {
    const { email, otp } = bodyData;

    const otpDoc = await this._redisMethods.get(
      this._redisMethods.getOTPKey({
        email,
        otpType: OTPEnum.confirmEmail,
      }),
    );

    if (!otpDoc) {
      throw new BadRequestException("Invalid or expired OTP");
    }

    const isOTPValid = await compareHash({
      plainText: otp,
      cipherText: String(otpDoc),
    });

    if (!isOTPValid) {
      throw new BadRequestException("Invalid or expired OTP");
    }

    await this._userRepo.updateOne({
      model: userModel,
      filter: { email },
      update: { confirmEmail: true, $unset: { confirmEmailExpires: 1 } },
    });

    await this._redisMethods.del(
      this._redisMethods.getOTPKey({
        email: email,
        otpType: OTPEnum.confirmEmail,
      }),
    );

    return { msg: "Email verified Successfully" };
  }

  public async resendEmailVerificationOTP(bodyData: resendEmailVerficationDto) {
    const { email } = bodyData;

    const user = await this._userRepo.findOne({
      filter: { email, confirmEmail: false },
    });

    if (!user) {
      throw new BadRequestException("Email doesn't exist or already verified.");
    }

    await this._mailService.sendConfirmEmail(user);

    return { msg: "Verification code was sent to your email." };
  }
}

export default new AuthService();
