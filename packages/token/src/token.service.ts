import { Injectable, Logger } from "@nestjs/common";
import { JwtService, JwtVerifyOptions } from "@nestjs/jwt";
import { addDays, addMinutes } from "date-fns";
import { CookieOptions } from "express";
import { Cookies, HasHashSalt } from "./types";

const prefix = "Bearer\u0020";

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) { }

  private logger = new Logger(TokenService.name);

  unwrapAuthCookie = (cookieVal: string) => cookieVal?.replace(prefix, "");
  wrapAuthCookie = (token: string) => `${prefix}${token}`;

  extractTokenFromAuthCookie(cookies: Cookies) {
    return this.unwrapAuthCookie(
      cookies[TokenService.AUTHORIZATION_COOKIE_NAME]
    );
  }

  async getSignerPayload<T>(data: T) {
    if (!data) {
      throw "No data";
    }
    return this.jwtService.signAsync({ data: data });
  }

  async getAuthorizationCookies<T>(payload: T, key?: keyof T) {
    try {
      const [unwrapped, device] = await Promise.all([
        this.getSignerPayload(payload),
        this.jwtService.signAsync({ data: key ? payload[key] : payload }),
      ]);
      return { token: this.wrapAuthCookie(unwrapped), device, user: payload };
    } catch (e) {
      this.logger.error(e);
    }
  }

  getLoginCookie = async (credentials: HasHashSalt) => {
    return this.jwtService.signAsync({
      data: { hash: credentials.hash, salt: credentials.salt },
    });
  };

  async verifyAsync(token, options: JwtVerifyOptions = {}) {
    try {
    return await this.jwtService.verifyAsync(token, {
      ...options,
      secret: process.env.JWT_SECRET,
    });
  } catch (e) {
    this.logger.error(e);
  }
  }

  async getPayload<T>(token): Promise<{ exp: number; data: T }> {
    if (!token) {
      throw "no token";
    }
    return await this.verifyAsync(token);
  }

  authOptions = () =>
    ({
      sameSite: "strict",
      httpOnly: true,
    }) as CookieOptions;

  otpOptions = () =>
    ({
      sameSite: "strict",
      httpOnly: true,
      expires: addMinutes(new Date(), 15),
    }) as CookieOptions;

  deviceOptions = () =>
    ({
      expires: addDays(new Date(), 30),
      sameSite: "strict",
    }) as CookieOptions;

  userInfoOptions = () =>
    ({
      expires: addDays(new Date(), 30),
      sameSite: "strict",
    }) as CookieOptions;

  static AUTHORIZATION_COOKIE_NAME = "Authorization";
  static DEVICE_COOKIE_NAME = "KnownDevice";
  static LOGIN_NAME = "Login";
  static USER_INFO = "UserInfo";
}
