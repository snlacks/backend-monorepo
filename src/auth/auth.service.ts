import * as crypto from 'crypto';
import * as assert from 'assert';
import * as otpGenerator from 'otp-generator';
import { isBefore } from 'date-fns';
import { Injectable } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { SmsService } from '../sms/sms.service';
import { User } from '../users/user.entity';
import { RequestOTPDTO } from './dto/one-time-password.dto';
import { SignInPasswordDto } from './dto/sign-in-password.dto';
import { UserResponse } from '../types';
import { HasHashSalt, HasOneTimePassword, SmsResponse } from './types';
import { UnauthorizedHandler } from '../decorators/unauthorized-handler.decorator';
import TokenService from '../token/token.service';
import SendService from '../mail/send.service';

const emailText = (oneTimePassword: string) => `
Hello!

The one-time passcode you requested is: ${oneTimePassword}.

Thank you for using my app.

For more information reply to this email.`;

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

const passMatch = async (entry: HasHashSalt, password) => {
  const hash = await hashOTP(password, entry.salt);
  assert(hash === entry.hash);

  return true;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private smsService: SmsService,
    private tokenService: TokenService,
    private mailService: SendService,
  ) {}

  @UnauthorizedHandler()
  async verifyOTP(
    username: string,
    oneTimePasswordToken: string,
    oneTimePassword: string,
  ): Promise<{ user: User; token: string; device: string }> {
    const user = await this.usersService.findOne(username);

    assert(user);
    const entry = await this.tokenService.getPayload(oneTimePasswordToken);
    assert(isBefore(new Date(), new Date(entry.exp * 1000)));
    await passMatch(entry.data as HasHashSalt, oneTimePassword);
    return {
      user,
      ...(await this.tokenService.getAuthorizationCookies(user)),
    };
  }

  @UnauthorizedHandler()
  async loginPasswordOnly(
    userInfo: SignInPasswordDto,
  ): Promise<UserResponse | HasOneTimePassword> {
    const user = await this.usersService.findOne(userInfo.username);
    const entry = await this.usersService.findPass(user.user_id);

    await passMatch(entry, userInfo.password);

    return user;
  }
  private async createOTP() {
    const oneTimePassword = generateOtp();

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await hashOTP(oneTimePassword, salt);

    return { oneTimePassword, salt, hash };
  }

  @UnauthorizedHandler()
  async requestOTP({
    username,
    phone_number,
    method = 'sms',
  }: RequestOTPDTO): Promise<string | any> {
    const user = await this.usersService.findOne(username);

    let codeResponse: HasOneTimePassword;
    if (method === 'sms') {
      const phoneNumbers = serializePhone(user.phone_number, phone_number);
      assert(phoneNumbers[0] === phoneNumbers[1]);
      codeResponse = await this.sendSms(user);
    } else {
      codeResponse = await this.sendEmail(user.username);
    }
    return codeResponse;
  }

  @UnauthorizedHandler()
  async sendEmail(username: string): Promise<HasOneTimePassword> {
    const oneTimePassword = await this.createOTP();
    await this.mailService.send({
      to: username,
      subject: `StevenLacks.com code is: ${oneTimePassword.oneTimePassword}`,
      text: emailText(oneTimePassword.oneTimePassword),
      html: emailText(oneTimePassword.oneTimePassword),
    });

    return { oneTimePassword };
  }

  @UnauthorizedHandler()
  async sendSms(user: UserResponse): Promise<SmsResponse> {
    const oneTimePassword = await this.createOTP();
    const smsResponse = await this.smsService.client.messages.create({
      body: `Your one-time passcode is ${oneTimePassword.oneTimePassword}`,
      from: process.env.ONE_TIME_PASSWORD_SMS_SENDER_NUMBER,
      to: user.phone_number,
    });

    assert(smsResponse && !smsResponse.errorMessage);
    return {
      body: smsResponse?.body.replace(/\d{6}/, '######'),
      oneTimePassword,
    };
  }
}
