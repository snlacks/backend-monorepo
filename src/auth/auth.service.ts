import * as crypto from 'crypto';
import * as otpGenerator from 'otp-generator';
import { formatISO, addMinutes, isAfter, isBefore } from 'date-fns';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { UsersService } from '../users/users.service';
import { OneTimePassword } from '../one-time-password/one-time-password.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SmsService } from '../sms/sms.service';

export const hashOTP = (oneTimePassword: string, salt) =>
  new Promise<string>((resolve, reject) =>
    crypto.pbkdf2(oneTimePassword, salt, 1000, 64, `sha512`, (err, h) => {
      if (err) {
        reject(err);
      }
      resolve(h.toString('hex'));
    }),
  );

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private smsService: SmsService,
    @InjectRepository(OneTimePassword)
    private otpRepository: Repository<OneTimePassword>,
  ) {}

  async signIn(username: string, oneTimePassword: string): Promise<string> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new UnauthorizedException();
    }

    const entry = await this.otpRepository.findOneBy({
      username,
    });

    if (isAfter(new Date(), new Date(entry.expiration))) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const hash = await hashOTP(oneTimePassword, entry.salt);

    if (hash !== entry.hash) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return await this.signToken(entry.username);
  }

  async requestOTP(username: string): Promise<string> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new UnauthorizedException();
    }

    await this.otpRepository.delete({ username });

    const oneTimePassword = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await hashOTP(oneTimePassword, salt);

    await this.otpRepository.insert({
      username,
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

  signToken(username: string) {
    return jwt.sign({ data: username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
  }

  verifyToken(token: string): jwt.JwtPayload & { data: string } {
    const verified = jwt.verify(token, process.env.JWT_SECRET) as
      | jwt.JwtPayload
      | string;

    if (
      verified.hasOwnProperty('data') &&
      verified.hasOwnProperty('exp') &&
      isBefore(new Date(), new Date((verified as jwt.JwtPayload).exp * 1000))
    ) {
      return verified as jwt.JwtPayload & { data };
    }
    throw new UnauthorizedException();
  }
}
