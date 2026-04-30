import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/exceptions/domain.exceptions.js";
import { OAuth2Client } from "google-auth-library";
import { encryptValue } from "../../common/security/encrypt.js";
import { compareHash, generateHash } from "../../common/security/hash.js";
import tokenService from "../../common/security/token.service.js";
import {
  ENCRYPTION_KEY,
  GOOGLE_CLIENT_ID,
} from "../../config/config.service.js";
import type { IHUser } from "../../DB/Models/User.model.js";
import UserRepo from "../../DB/Repo/user.repo.js";
import type {
  forgetPasswordOTPDto,
  LoginDto,
  resendEmailVerficationDto,
  resendForgetPasswordVerificationOTPDto,
  resetPasswordDto,
  SignupDto,
  verifyEmailDto,
  verifyForgetPasswordOTPDto,
} from "./auth.dto.js";
import CryptoJS from "crypto-js";
import MailService from "../../common/email/email.service.js";
import RedisService from "../../DB/Redis/redis.service.js";
import { OTPEnum } from "../../common/enums/otp.enum.js";
import { ProviderEnum } from "../../common/enums/user.enums.js";

class AuthService {
  private _userRepo = UserRepo;
  private _tokenService = tokenService;
  private _mailService = MailService;
  private _redisMethods = RedisService;

  private async _verifyGoogleToken(idToken: string) {
    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    return payload;
  }

  private async _verifyOTP(email: string, otp: string, otpType: OTPEnum) {
    const otpDoc = await this._redisMethods.get(
      this._redisMethods.getOTPKey({
        email,
        otpType,
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
  }

  public async signup(bodyData: SignupDto): Promise<IHUser> {
    const { email, password, phone } = bodyData;
    const isEmail = await this._userRepo.findOne({ filter: { email } });
    if (isEmail) {
      throw new ConflictException("Email already exists.");
    }

    const [user] = await this._userRepo.create({ data: [bodyData] });

    if (!user) {
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

  public async signupWithGmail(idToken: string) {
    const payload = await this._verifyGoogleToken(idToken);

    if (payload == undefined) {
      throw new BadRequestException("Token Payload is invalid.");
    }

    if (!payload.email_verified) {
      throw new BadRequestException("Email must be verified.");
    }

    const user = await this._userRepo.findOne({
      filter: { email: payload.email as string },
    });

    if (user) {
      if (user.provider === ProviderEnum.System) {
        throw new BadRequestException(
          "Account already exists. Please login with your email and password.",
        );
      }
      return await this.loginWithGoogle(idToken);
    }

    const [firstName, lastName] = payload.name!.split(" ");

    const [newUser] = await this._userRepo.create({
      data: [
        {
          email: payload.email,
          userName: payload.name,
          profilePic: payload.picture,
          confirmEmail: true,
          provider: ProviderEnum.Google,
        },
      ],
    });

    if (!newUser) {
      throw new BadRequestException("Failed to create user.");
    }

    const { access_token, refresh_token } =
      this._tokenService.generateAccessAndRefreshTokens({
        role: newUser.role,
        sub: String(newUser._id),
      });

    return {
      access_token,
      refresh_token,
    };
  }

  public async loginWithGoogle(idToken: string): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const payload = await this._verifyGoogleToken(idToken);

    if (payload == undefined) {
      throw new BadRequestException("Token Payload is invalid.");
    }

    if (!payload.email_verified) {
      throw new BadRequestException("Email must be verified.");
    }

    const user = await this._userRepo.findOne({
      filter: { email: payload.email as string, provider: ProviderEnum.Google },
    });

    if (!user) {
      throw new BadRequestException("User doesn't exist.");
    }

    const { access_token, refresh_token } =
      this._tokenService.generateAccessAndRefreshTokens({
        role: user.role,
        sub: String(user._id),
      });

    return {
      access_token,
      refresh_token,
    };
  }

  public async verifyEmail(bodyData: verifyEmailDto) {
    const { email, otp } = bodyData;

    const otpType = OTPEnum.confirmEmail;

    await this._verifyOTP(email, otp, otpType);

    await this._userRepo.updateOne({
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
      throw new BadRequestException("Email doesn't exist.");
    }

    if (user.confirmEmail) {
      throw new BadRequestException("Email already verified.");
    }

    await this._mailService.sendConfirmEmail(user);

    return { msg: "Verification code was sent to your email." };
  }

  public async forgetPasswordOTP(bodyData: forgetPasswordOTPDto) {
    const { email } = bodyData;

    const user = await this._userRepo.findOne({ filter: { email } });

    if (!user) {
      throw new BadRequestException("User doesn't exist.");
    }

    if (!user.confirmEmail) {
      throw new BadRequestException("Please confirm your email first.");
    }

    await this._mailService.sendForgetPassword(email);

    return { msg: "Check your Email." };
  }

  public async resendForgetPasswordVerificationOTP(
    bodyData: resendForgetPasswordVerificationOTPDto,
  ) {
    const { email } = bodyData;

    await this._mailService.sendForgetPassword(email);
    return { msg: "Verification code was sent to your email." };
  }

  public async verifyForgetPasswordOTP(bodyData: verifyForgetPasswordOTPDto) {
    const { email, otp } = bodyData;

    const otpType = OTPEnum.forgetPassword;

    await this._verifyOTP(email, otp, otpType);

    return { msg: "Verfied Successfully." };
  }

  public async resetPasswordOTP(bodyData: resetPasswordDto) {
    const { email, password, otp } = bodyData;

    await this.verifyForgetPasswordOTP({ email, otp });

    await this._userRepo.updateOne({
      filter: { email },
      update: {
        password: await generateHash({
          plainText: password,
        }),
      },
    });

    return { msg: "Your password was reset successfully." };
  }
}

export default new AuthService();
