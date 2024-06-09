import * as crypto from 'crypto';
import * as otpGenerator from 'otp-generator';
import { formatISO, addMinutes, isAfter } from 'date-fns';
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
import { MessageInstance as TwMessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
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
const phoneChars = new RegExp('(\\(|\\)|-|\\s*)+', 'gi');

const phoneMatch = (
  dto: RequestOTPDTO,
  userPhone: string,
): { passwordRequired: string; match?: boolean } => {
  if (dto?.password) {
    return { passwordRequired: 'required' };
  }
  if (
    dto?.phone_number?.replace(phoneChars, '') !==
    userPhone.replace(phoneChars, '')
  ) {
    throw new UnauthorizedException();
  }
  return { match: true, passwordRequired: '' };
};

const passMatch = async (entry: Password | OneTimePassword, password) => {
  const hash = await hashOTP(password, entry.salt);

  if (hash !== entry.hash) {
    throw new UnauthorizedException();
  }
  return {
    match: true,
  };
};
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

  async verifyOTP(
    username: string,
    oneTimePassword: string,
  ): Promise<{ user: User; token: string }> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new UnauthorizedException();
    }

    const entry = await this.otpRepository.findOneBy({
      username,
    });

    if (isAfter(new Date(), new Date(entry.expiration))) {
      throw new UnauthorizedException();
    }

    const hash = await hashOTP(oneTimePassword, entry.salt);

    if (hash !== entry.hash) {
      throw new UnauthorizedException();
    }
    return {
      user,
      token: await AuthGuard.getSignerPayload(user, this.jwtService),
    };
  }

  async loginPasswordOnly(
    userInfo: SignInPasswordOnlyDto,
    knownDevice?: string,
  ): Promise<SmsResponse | UserResponse> {
    try {
      const user = await this.usersService.findOne(userInfo.username);
      const entry = await this.usersService.findPass(user.user_id);
      await passMatch(entry, userInfo.password);
      if (knownDevice !== user.user_id) {
        return this.sendOtp(user);
      }
      return user;
    } catch (e) {
      this.logger.error(e);
    }
  }

  async requestOTP(
    userInfo: RequestOTPDTO,
  ): Promise<string | User | SmsResponse> {
    if (!userInfo.password && !userInfo.phone_number) {
      this.logger.error('No credentials');
      throw new UnauthorizedException('No credentials');
    }
    const user = await this.usersService.findOne(userInfo.username);
    let phoneMatchResponse;

    try {
      phoneMatchResponse = phoneMatch(userInfo, user.phone_number);
    } catch (e) {
      this.logger.error(e);
      throw new UnauthorizedException();
    }

    try {
      if (phoneMatchResponse.password === 'required') {
        const entry = await this.usersService.findPass(user.user_id);
        await passMatch(entry, userInfo.password);
      }
    } catch (e) {
      this.logger.error(e);
    }
    const smsReponse = await this.sendOtp(user);

    return isDevTest ? smsReponse : '';
  }

  async sendOtp(user: UserResponse): Promise<SmsResponse> {
    let smsResponse: TwMessageInstance;
    let oneTimePassword: string;
    try {
      await this.otpRepository.delete({ username: user.username });
      oneTimePassword = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      const salt = crypto.randomBytes(16).toString('hex');
      const hash = await hashOTP(oneTimePassword, salt);

      await this.otpRepository.insert({
        username: user.username,
        hash,
        salt,
        expiration: formatISO(addMinutes(new Date(), 15)),
      });

      smsResponse = await new Promise<TwMessageInstance>((resolve, reject) =>
        this.smsService.client.messages
          .create({
            body: `Your one-time passcode is ${oneTimePassword}`,
            from: process.env.ONE_TIME_PASSWORD_SMS_SENDER_NUMBER,
            to: user.phone_number,
          })
          .then((d: TwMessageInstance) => {
            resolve(d);
          })
          .catch((reason) => {
            this.logger.error(reason);
            reject(reason);
          }),
      );
    } catch (e) {
      this.logger.error(e);
    }
    const finalResponse = {
      oneTimePassword: oneTimePassword.replace(/\d{6}/, '######'),
      errorMessage: smsResponse?.errorMessage,
      body: smsResponse?.body.replace(/\d{6}/, '######'),
    };
    return finalResponse as SmsResponse;
  }
}
