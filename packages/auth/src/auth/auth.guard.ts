import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../users/public.decorator';
import { isAfter } from 'date-fns';
import { TokenService } from '@snlacks/core/token';
import { UnauthorizedHandler } from '../decorators/unauthorized-handler.decorator';
import * as assert from 'assert';

export const checkPayloadFreshness = (payload?: { exp: number }) => {
  if (!payload || isAfter(new Date(), new Date(payload.exp * 1000))) {
    return false;
  }
  return true;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private reflector: Reflector,
  ) {}

  private logger = new Logger(AuthGuard.name)

  @UnauthorizedHandler()
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (isPublic) {
        return true;
      }
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();

      const incomingToken = this.tokenService.extractTokenFromAuthCookie(
        request.cookies,
      );

      assert(incomingToken);

      const payload = await this.tokenService.getPayload(incomingToken);

      assert(checkPayloadFreshness(payload));

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
    } catch (e) {
      this.logger.error(e.message, e.stack);
      throw new UnauthorizedException();
    }
  }
}
