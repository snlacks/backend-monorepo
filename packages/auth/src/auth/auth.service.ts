import * as crypto from 'crypto';
import * as assert from 'assert';
import * as otpGenerator from 'otp-generator';
import { isBefore } from 'date-fns';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { TokenService } from '@snlacks/core/token';

import { RequestOTPDTO } from './dto/one-time-password.dto';
import { SignInPasswordDto } from './dto/sign-in-password.dto';
import { UnauthorizedHandler } from '../decorators/unauthorized-handler.decorator';
import {
  HasHashSalt,
  HasOneTimePassword,
  ISendService,
  ISmsService,
  SmsResponse,
  IUser,
} from '../../types';
import { UsersService } from '../users/users.service';

const emailText = (oneTimePassword: string) => `
Hello!

The one-time passcode you requested is: ${oneTimePassword}.

Thank you for using my app.

For more information reply to this email.`;

export const SNL_AUTH_MAILER_KEY = 'SNL_AUTH_MAILER_KEY';
export const SNL_AUTH_SMS_KEY = 'SNL_AUTH_SMS_KEY';
export const SNL_AUTH_USERS_KEY = 'SNL_AUTH_USERS_KEY';
export const checkEnv = (name: string) => {
  if (!process.env[name]) {
    throw new Error(`${name} is a required Environmental Variable`);
  }
};
export const hashOTP = (oneTimePassword: string, salt) =>
  new Promise<string>((resolve, reject) =>
    crypto.pbkdf2(oneTimePassword, salt, 1000, 64, `sha512`, (err, h) => {
      if (err) {
        reject(err);
      }
      resolve(h.toString('hex'));
    }),
  );

const generateOtp = () =>
  otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
const phoneChars = new RegExp('(\\(|\\)|-|\\s*)+', 'gi');

const serializePhone = (...phoneNumbers: string[]) =>
  phoneNumbers.map((p) => p.replace(phoneChars, ''));

const passMatch = async (entry: HasHashSalt, password: string) => {
  const hash = await hashOTP(password, entry.salt);
  assert(hash === entry.hash);

  return true;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    @Inject(SNL_AUTH_SMS_KEY) private smsService: ISmsService,
    private tokenService: TokenService,
    @Inject(SNL_AUTH_MAILER_KEY) private mailService: ISendService,
  ) {}

  private logger = new Logger(AuthService.name);

  @UnauthorizedHandler()
  async verifyOTP(
    username: string,
    oneTimePasswordToken: string,
    oneTimePassword: string,
  ): Promise<{ user: IUser; token: string; device: string }> {
    const user = await this.usersService.findOne(username);
    assert(user);

    const entry = await this.tokenService.getPayload(oneTimePasswordToken);
    assert(isBefore(new Date(), new Date(entry.exp * 1000)));
    await passMatch(entry.data as HasHashSalt, oneTimePassword);
    return {
      ...(await this.tokenService.getAuthorizationCookies(user)),
    };
  }

  @UnauthorizedHandler()
  async loginPasswordOnly(userInfo: SignInPasswordDto): Promise<IUser> {
    const user = await this.usersService.findOne(userInfo.username);
    const entry = await this.usersService.findPass(user.user_id);

    await passMatch(entry, userInfo.password);
    return user;
  }

  async checkAttempts(username: string) {
    const attempts = await this.usersService.getAttempts(username);

    if (attempts.length > 6) {
      throw 'Too many attempts, try again in 15 minutes.';
    } else if (attempts.length > 0 && attempts.length <= 5) {
      await new Promise<void>((resolve) =>
        setTimeout(() => {
          resolve();
        }, attempts.length * 1000),
      );
    }
  }

  async createOTP() {
    const oneTimePassword = generateOtp();

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await hashOTP(oneTimePassword, salt);

    return { oneTimePassword, salt, hash };
  }

  @UnauthorizedHandler()
  async requestOTP(
    { username, phone_number, method = 'sms' }: RequestOTPDTO,
    hostname?: string,
  ): Promise<string | any> {
    const user = await this.usersService.findOne(username);
    let codeResponse: HasOneTimePassword;
    if (method === 'sms') {
      const phoneNumbers = serializePhone(user.phone_number, phone_number);
      assert(phoneNumbers[0] === phoneNumbers[1]);
      codeResponse = await this.sendSms(user);
    } else {
      codeResponse = await this.sendEmail(user.username, hostname);
    }
    return codeResponse;
  }

  @UnauthorizedHandler()
  async sendEmail(
    username: string,
    hostname?: string,
  ): Promise<HasOneTimePassword> {
    const creds = await this.createOTP();
    try {
      await this.mailService.send({
        to: username,
        subject: `Your ${hostname || 'login'} code is: ${creds.oneTimePassword}`,
        text: emailText(creds.oneTimePassword),
        html: emailText(creds.oneTimePassword),
      });
    } catch (e) {
      this.logger.error(e.message);
    }
    return { credentials: creds };
  }

  @UnauthorizedHandler()
  async sendSms(user: IUser): Promise<SmsResponse> {
      const credentials = await this.createOTP();

      checkEnv('ONE_TIME_PASSWORD_SMS_SENDER_NUMBER');
      const smsResponse = await this.smsService.send({
        body: `Your one-time passcode is ${credentials.oneTimePassword}`,
        from: process.env.ONE_TIME_PASSWORD_SMS_SENDER_NUMBER,
        to: user.phone_number,
      });

      assert(smsResponse && !smsResponse.errorMessage);
      return {
        body: smsResponse?.body.replace(/\d{6}/, '######'),
        credentials,
      };
  }
}
