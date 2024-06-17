import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { addDays } from 'date-fns';
import { Cookies } from './types';
import { UserResponse } from '../types';
import { UnauthorizedHandler } from '../decorators/unauthorized-handler.decorator';
import { CookieOptions } from 'express';

const prefix = 'Bearer\u0020';

@Injectable()
export default class TokenService {
  constructor(private jwtService: JwtService) {}

  unwrapAuthCookie = (cookieVal: string) => cookieVal?.replace(prefix, '');
  wrapAuthCookie = (token: string) => `${prefix}${token}`;

  extractTokenFromAuthCookie(cookies: Cookies) {
    return this.unwrapAuthCookie(
      cookies[TokenService.AUTHORIZATION_COOKIE_NAME],
    );
  }

  @UnauthorizedHandler()
  async getSignerPayload<T>(data: T) {
    if (!data) {
      throw 'No data';
    }
    return this.jwtService.signAsync({ data: data });
  }

  @UnauthorizedHandler()
  async getAuthorizationCookies(user: UserResponse) {
    const [unwrapped, device] = await Promise.all([
      this.getSignerPayload(user),
      this.jwtService.signAsync({ data: user.user_id }),
    ]);
    return { token: this.wrapAuthCookie(unwrapped), device };
  }

  @UnauthorizedHandler()
  async verifyAsync(token) {
    return await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET,
    });
  }

  @UnauthorizedHandler()
  async getPayload(token): Promise<{ exp: number; data: any }> {
    if (!token) {
      throw 'no token';
    }
    return await this.verifyAsync(token);
  }

  authOptions = () =>
    ({
      sameSite: 'strict',
      httpOnly: true,
    }) as CookieOptions;

  deviceOptions = () =>
    ({
      expires: addDays(new Date(), 30),
      sameSite: 'strict',
    }) as CookieOptions;

  static AUTHORIZATION_COOKIE_NAME = 'Authorization';
  static DEVICE_COOKIE_NAME = 'KnownDevice';
}
