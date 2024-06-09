import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { ROLE } from './roles';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { AuthGuard } from '../auth/auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}
  private readonly logger = new Logger(RolesGuard.name);

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
    const token = AuthGuard.extractTokenFromCookie(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload.data;

      authorized = requiredRoles.some(
        (role) => request.user.roles?.find(({ role_id }) => role === role_id),
      );
    } catch (e) {
      this.logger.error(e);
      throw new UnauthorizedException();
    }
    return authorized;
  }
}
