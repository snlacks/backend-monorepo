import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { ROLE } from './roles';
import TokenService from '../token/token.service';
import { UnauthorizedHandler } from '../decorators/unauthorized-handler.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private reflector: Reflector,
  ) {}

  @UnauthorizedHandler()
  async canActivate(context: ExecutionContext): Promise<boolean> {
    let authorized = false;
    const requiredRoles = this.reflector.getAllAndOverride<ROLE[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.[0]) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.tokenService.extractTokenFromAuthCookie(request.cookies);
    if (!token) {
      throw 'no token';
    }

    const payload = await this.tokenService.verifyAsync(token);
    request['user'] = payload.data;

    authorized = requiredRoles.some(
      (role) => request.user.roles?.find(({ role_id }) => role === role_id),
    );
    return authorized;
  }
}
