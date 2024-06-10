import * as crypto from 'crypto';
import * as assert from 'assert';
import * as otpGenerator from 'otp-generator';
import { formatISO, addMinutes, isBefore } from 'date-fns';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { OneTimePassword } from '../one-time-password/one-time-password.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SmsService } from '../sms/sms.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { RequestOTPDTO } from '../one-time-password/dto/one-time-password.dto';
import { AuthGuard } from './auth.guard';
import { Password } from '../users/password.entity';
import { SignInPasswordOnlyDto } from './dto/sign-in-password.dto';
import { UserResponse } from '../users/types';
import { SmsResponse } from './types';

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
function UnauthorizedHandler(): MethodDecorator {
  return function (_, name, descriptor: PropertyDescriptor) {
    const logger = new Logger(name as string);
    const method = descriptor.value;

    descriptor.value = async function (...args) {
      try {
        return await method.apply(this, args);
      } catch (e) {
        logger.error(e);
        throw new UnauthorizedException();
      }
    };
  };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private smsService: SmsService,
    @InjectRepository(OneTimePassword)
    private otpRepository: Repository<OneTimePassword>,
    private jwtService: JwtService,
  ) {}
  private readonly logger = new Logger(AuthService.name);

  @UnauthorizedHandler()
  async verifyOTP(
    username: string,
    oneTimePassword: string,
  ): Promise<{ user: User; token: string }> {
    const user = await this.usersService.findOne(username);
    assert(user);

    const entry = await this.otpRepository.findOneBy({
      username,
    });

    assert(isBefore(new Date(), new Date(entry.expiration)));
    await passMatch(entry, oneTimePassword);

    return {
      user,
      token: await AuthGuard.getSignerPayload(user, this.jwtService),
    };
  }

  @UnauthorizedHandler()
  async loginPasswordOnly(
    userInfo: SignInPasswordOnlyDto,
    knownDevice?: string,
  ): Promise<SmsResponse | UserResponse> {
    const user = await this.usersService.findOne(userInfo.username);
    const entry = await this.usersService.findPass(user.user_id);

    await passMatch(entry, userInfo.password);

    if (knownDevice !== user.user_id) {
      return this.sendOtp(user);
    }
    return user;
  }

  @UnauthorizedHandler()
  async requestOTP(
    userInfo: RequestOTPDTO,
  ): Promise<string | User | SmsResponse> {
    const user = await this.usersService.findOne(userInfo.username);

    const phoneNumbers = serializePhone(
      user.phone_number,
      userInfo.phone_number,
    );

    assert(phoneNumbers[0] === phoneNumbers[1]);

    const smsReponse = await this.sendOtp(user);

    return isDevTest ? smsReponse : '';
  }

  @UnauthorizedHandler()
  async sendOtp(user: UserResponse): Promise<SmsResponse> {
    await this.otpRepository.delete({ username: user.username });

    const oneTimePassword = generateOtp();

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await hashOTP(oneTimePassword, salt);

    await this.otpRepository.insert({
      username: user.username,
      hash,
      salt,
      expiration: formatISO(addMinutes(new Date(), 15)),
    });

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
