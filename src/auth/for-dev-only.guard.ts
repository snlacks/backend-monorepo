import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE } from '../roles/roles';
import { FOR_DEV_ONLY } from './for-dev-only.decorator';

export const DEVELOPMENT = 'development';

@Injectable()
export class ForDevOnlyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isDevOnly = this.reflector.getAllAndOverride<ROLE[]>(FOR_DEV_ONLY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isDevOnly && process.env.NODE_ENV !== DEVELOPMENT) {
      console.log(process.env.NODE_ENV);
      return false;
    }
    if (process.env.NODE_ENV === DEVELOPMENT || !isDevOnly) {
      return true;
    }
    return false;
  }
}
