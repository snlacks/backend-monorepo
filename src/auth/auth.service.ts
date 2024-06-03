import * as crypto from 'crypto';
import * as otpGenerator from 'otp-generator';
import { formatISO, addMinutes, isAfter } from 'date-fns';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { OneTimePassword } from '../one-time-password/one-time-password.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SmsService } from '../sms/sms.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { RequestOTPDTO } from '../one-time-password/one-time-password.dto';
import { AuthGuard } from './auth.guard';

export const hashOTP = (oneTimePassword: string, salt) =>
  new Promise<string>((resolve, reject) =>
    crypto.pbkdf2(oneTimePassword, salt, 1000, 64, `sha512`, (err, h) => {
      if (err) {
        reject(err);
      }
      resolve(h.toString('hex'));
    }),
  );
const phoneChars = new RegExp('()-', 'gi');

const phoneMatch = (p1: string, p2: string) =>
  p1.replace(phoneChars, '') === p2.replace(phoneChars, '');

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private smsService: SmsService,
    @InjectRepository(OneTimePassword)
    private otpRepository: Repository<OneTimePassword>,
    private jwtService: JwtService,
  ) {}

  async signIn(
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

  async requestOTP(userInfo: RequestOTPDTO): Promise<string> {
    const user = await this.usersService.findOne(userInfo.username);
    if (!user || !phoneMatch(user.phoneNumber, userInfo.phoneNumber)) {
      throw new UnauthorizedException();
    }

    await this.otpRepository.delete({ username: user.username });

    const oneTimePassword = otpGenerator.generate(6, {
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

    await new Promise((resolve, reject) =>
      this.smsService.client.messages
        .create({
          body: `Your one-time passcode is ${oneTimePassword}`,
          from: process.env.ONE_TIME_PASSWORD_SMS_SENDER_NUMBER,
          to: user.phoneNumber,
        })
        .then(resolve)
        .catch(reject),
    );
    return oneTimePassword;
  }
}
