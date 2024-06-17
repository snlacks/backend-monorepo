import * as crypto from 'crypto';
import * as assert from 'assert';
import * as otpGenerator from 'otp-generator';
import { formatISO, addMinutes, isBefore } from 'date-fns';
import { Injectable } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { OneTimePassword } from '../one-time-password/one-time-password.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SmsService } from '../sms/sms.service';
import { User } from '../users/user.entity';
import { RequestOTPDTO } from '../one-time-password/dto/one-time-password.dto';
import { Password } from '../users/password.entity';
import { SignInPasswordOnlyDto } from './dto/sign-in-password.dto';
import { UserResponse } from '../types';
import { SmsResponse } from './types';
import { UnauthorizedHandler } from '../decorators/unauthorized-handler.decorator';
import TokenService from '../token/token.service';
import SendService from '../mail/send.service';

const emaiLText = (oneTimePassword: string) => `
Hello!

The one-time passcode you requested is: ${oneTimePassword}.

Thank you for using my app.

For more information reply to this email.`;

const isDevTest =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

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

const passMatch = async (entry: Password | OneTimePassword, password) => {
  const hash = await hashOTP(password, entry.salt);
  assert(hash === entry.hash);

  return true;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private smsService: SmsService,
    @InjectRepository(OneTimePassword)
    private otpRepository: Repository<OneTimePassword>,
    private tokenService: TokenService,
    private mailService: SendService,
  ) {}

  @UnauthorizedHandler()
  async verifyOTP(
    username: string,
    oneTimePassword: string,
  ): Promise<{ user: User; token: string; device: string }> {
    const user = await this.usersService.findOne(username);
    assert(user);

    const entry = await this.otpRepository.findOneBy({
      username,
    });

    assert(isBefore(new Date(), new Date(entry.expiration)));
    await passMatch(entry, oneTimePassword);

    return {
      user,
      ...(await this.tokenService.getAuthorizationCookies(user)),
    };
  }

  @UnauthorizedHandler()
  async loginPasswordOnly(
    userInfo: SignInPasswordOnlyDto,
    knownDevice?: string,
  ): Promise<any | UserResponse> {
    const user = await this.usersService.findOne(userInfo.username);
    const entry = await this.usersService.findPass(user.user_id);

    await passMatch(entry, userInfo.password);

    if (knownDevice !== user.user_id) {
      return this.sendEmail(user.username);
    }
    return user;
  }
  private async createOTP(username: string) {
    await this.otpRepository.delete({ username: username });

    const oneTimePassword = generateOtp();

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await hashOTP(oneTimePassword, salt);

    await this.otpRepository.insert({
      username,
      hash,
      salt,
      expiration: formatISO(addMinutes(new Date(), 15)),
    });
    return oneTimePassword;
  }

  @UnauthorizedHandler()
  async requestOTP({
    username,
    phone_number,
    method = 'sms',
  }: RequestOTPDTO): Promise<string | any> {
    const user = await this.usersService.findOne(username);

    let codeResponse;
    if (method === 'sms') {
      const phoneNumbers = serializePhone(user.phone_number, phone_number);
      assert(phoneNumbers[0] === phoneNumbers[1]);
      codeResponse = await this.sendSms(user);
    } else {
      codeResponse = await this.sendEmail(user.username);
    }
    return isDevTest ? codeResponse : '';
  }

  @UnauthorizedHandler()
  async sendEmail(username: string) {
    const oneTimePassword = await this.createOTP(username);
    const codeResponse = await this.mailService.send({
      to: username,
      subject: `StevenLacks.com code is: ${oneTimePassword}`,
      text: emaiLText(oneTimePassword),
      html: emaiLText(oneTimePassword),
    });
    return codeResponse;
  }

  @UnauthorizedHandler()
  async sendSms(user: UserResponse): Promise<SmsResponse> {
    const oneTimePassword = await this.createOTP(user.username);
    const smsResponse = await this.smsService.client.messages.create({
      body: `Your one-time passcode is ${oneTimePassword}`,
      from: process.env.ONE_TIME_PASSWORD_SMS_SENDER_NUMBER,
      to: user.phone_number,
    });

    assert(smsResponse && !smsResponse.errorMessage);
    return {
      body: smsResponse?.body.replace(/\d{6}/, '######'),
    };
  }
}
