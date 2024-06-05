import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../users/public.decorator';
import { JwtService } from '@nestjs/jwt';
import { isAfter } from 'date-fns';
import { User } from '../users/user.entity';

const prefix = 'Bearer\u0020';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

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

    const token = await AuthGuard.extractTokenFromCookie(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch (e) {
      new UnauthorizedException();
    }
    if (!payload || isAfter(new Date(), new Date(payload.exp * 1000))) {
      throw new UnauthorizedException();
    }

    request['user'] = payload.data;
    try {
      await AuthGuard.setCookie(payload.data, response, this.jwtService);
    } catch (e) {
      throw new UnauthorizedException();
    }
    return true;
  }

  static unwrapCookie = (cookieVal: string) => cookieVal?.replace(prefix, '');
  static wrapCookie = (token: string) => `${prefix}${token}`;

  static extractTokenFromCookie = async (request: Request) => {
    return await AuthGuard.unwrapCookie(request.cookies['Authorization']);
  };

  static getSignerPayload = async (user: User, jwtService) => {
    if (!user) {
      throw new UnauthorizedException();
    }
    return jwtService.signAsync({ data: user });
  };

  static setCookie = async (
    user: User,
    response: Response,
    jwtService: JwtService,
  ) => {
    const token = await AuthGuard.wrapCookie(
      await AuthGuard.getSignerPayload(user, jwtService),
    );
    await response.cookie('Authorization', token, {
      sameSite: 'strict',
      httpOnly: true,
    });
    return token;
  };
}
