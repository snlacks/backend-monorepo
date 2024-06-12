import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { addDays } from 'date-fns';
import { CookieSetter, Cookies } from './types';
import { UserResponse } from '../types';
import { UnauthorizedHandler } from '../decorators/unauthorized-handler.decorator';

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
  async setAuthorizationCookies(user: UserResponse, setCookie: CookieSetter) {
    const token = this.wrapAuthCookie(await this.getSignerPayload(user));
    setCookie(TokenService.AUTHORIZATION_COOKIE_NAME, token, {
      sameSite: 'strict',
      httpOnly: true,
    });
    setCookie(
      TokenService.DEVICE_COOKIE_NAME,
      await this.jwtService.signAsync({ data: user.user_id }),
      {
        expires: addDays(new Date(), 30),
        sameSite: 'strict',
      },
    );
    return token;
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

  static AUTHORIZATION_COOKIE_NAME = 'Authorization';
  static DEVICE_COOKIE_NAME = 'KnownDevice';
}
