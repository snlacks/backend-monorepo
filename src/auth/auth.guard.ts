import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../users/public.decorator';
import { JwtService } from '@nestjs/jwt';
import { addDays, isAfter } from 'date-fns';
import { User } from '../users/user.entity';

const prefix = 'Bearer\u0020';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  private readonly logger = new Logger(AuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const token = AuthGuard.extractTokenFromCookie(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    const payload = await AuthGuard.getPayload(
      token,
      this.jwtService,
      this.logger,
    );
    if (!payload || isAfter(new Date(), new Date(payload.exp * 1000))) {
      throw new UnauthorizedException();
    }

    request['user'] = payload.data;
    try {
      await AuthGuard.setAuthorizationCookie(
        payload.data,
        response,
        this.jwtService,
      );
    } catch (e) {
      throw new UnauthorizedException();
    }
    return true;
  }

  static unwrapCookie = (cookieVal: string) => cookieVal?.replace(prefix, '');
  static wrapCookie = (token: string) => `${prefix}${token}`;

  static extractTokenFromCookie = (request: Request) => {
    return AuthGuard.unwrapCookie(
      request.cookies[AuthGuard.AUTHORIZATION_COOKIE_NAME],
    );
  };

  static getSignerPayload = async (user: User, jwtService) => {
    if (!user) {
      throw new UnauthorizedException();
    }
    return jwtService.signAsync({ data: user });
  };

  static setAuthorizationCookie = async (
    user: User,
    response: Response,
    jwtService: JwtService,
  ) => {
    const token = await AuthGuard.wrapCookie(
      await AuthGuard.getSignerPayload(user, jwtService),
    );
    response.cookie(AuthGuard.AUTHORIZATION_COOKIE_NAME, token, {
      sameSite: 'strict',
      httpOnly: true,
    });
    response.cookie(
      AuthGuard.DEVICE_COOKIE_NAME,
      await jwtService.signAsync({ data: user.user_id }),
      {
        expires: addDays(new Date(), 30),
        sameSite: 'strict',
      },
    );
    return token;
  };

  static getPayload = async (
    token,
    jwtService: JwtService,
    logger: Logger,
  ): Promise<{ exp: number; data: User }> => {
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      return await jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch (e) {
      logger.log(e);
      new UnauthorizedException();
    }
  };

  static AUTHORIZATION_COOKIE_NAME = 'Authorization';
  static DEVICE_COOKIE_NAME = 'KnownDevice';
}
