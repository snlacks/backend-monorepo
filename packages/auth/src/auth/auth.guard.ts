import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../users/public.decorator';
import { isAfter } from 'date-fns';
import { TokenService } from '@snlacks/core/token';
import { UnauthorizedHandler } from '../decorators/unauthorized-handler.decorator';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private reflector: Reflector,
  ) {}

  @UnauthorizedHandler()
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

    const incomingToken = this.tokenService.extractTokenFromAuthCookie(
      request.cookies,
    );
    if (!incomingToken) {
      throw '';
    }
    const payload = await this.tokenService.getPayload(incomingToken);
    if (!payload || isAfter(new Date(), new Date(payload.exp * 1000))) {
      throw '';
    }

    request['user'] = payload.data;
    const { token, device } = await this.tokenService.getAuthorizationCookies(
      payload.data,
    );
    response.cookie(
      TokenService.AUTHORIZATION_COOKIE_NAME,
      token,
      this.tokenService.authOptions(),
    );
    response.cookie(
      TokenService.DEVICE_COOKIE_NAME,
      device,
      this.tokenService.deviceOptions(),
    );
    return true;
  }
}
