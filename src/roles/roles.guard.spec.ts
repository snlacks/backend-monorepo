import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { someToken } from '../auth/auth.mock';
import { RolesGuard } from './roles.guard';
import { getExecutionContext } from '../_mock-data/execution-context-data';
import TokenService from '../token/token.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let context: ExecutionContext;
  let tokenService: TokenService;
  let reflector: Reflector;
  const testUser = {
    username: 'test@test.com',
    phone_number: '+1123456789',
    roles: [{ role_id: 'USER', role_name: 'user' }],
  };
  const _jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(() => ({ data: testUser })),
  } as unknown as JwtService;
  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(() => ['USER']),
    } as unknown as Reflector;
    tokenService = new TokenService({
      verifyAsync: jest.fn(() => ({ data: testUser })),
    } as any);

    guard = new RolesGuard(tokenService, reflector);
    context = getExecutionContext();
  });
  it('should succeed', async () => {
    jest.spyOn(tokenService, 'verifyAsync');
    await guard.canActivate(context as any).then((d) => expect(d).toBe(true));
    expect(tokenService.verifyAsync).toHaveBeenCalledWith(
      `Bearer%20${someToken()}; Path=/; HttpOnly; SameSite=Strict; Domain=localhost`,
    );
  });

  it('should fail without user', async () => {
    guard = new RolesGuard(tokenService, reflector);
    expect.assertions(1);

    await guard
      .canActivate({
        ...context,
        switchToHttp: () => ({
          getRequest: () => ({
            cookies: {},
          }),
        }),
      } as any)
      .catch((e) => expect(e.message).toBe('Unauthorized'));
  });

  it('should fail without role', async () => {
    guard = new RolesGuard(
      new TokenService({
        ..._jwtService,
        verifyAsync: () => {
          throw 'Oops';
        },
      } as any),
      reflector,
    );
    expect.assertions(1);

    await guard
      .canActivate(context as any)
      .catch((e) => expect(e.message).toBe('Unauthorized'));
  });
  it('should succeed with no required roles', async () => {
    reflector = {
      ...reflector,
      getAllAndOverride: jest.fn(),
    } as any;
    jest.spyOn(tokenService, 'verifyAsync');
    guard = new RolesGuard(tokenService, reflector);

    await guard.canActivate(context as any).then((d) => expect(d).toBe(true));
    expect(tokenService.verifyAsync).not.toHaveBeenCalledWith();
  });
  it('should succeed with no required roles, but receives an empty array of required roles', async () => {
    reflector = {
      ...reflector,
      getAllAndOverride: jest.fn(() => undefined),
    } as any;
    jest.spyOn(tokenService, 'verifyAsync');
    guard = new RolesGuard(tokenService, reflector);

    await guard.canActivate(context as any).then((d) => expect(d).toBe(true));
    expect(tokenService.verifyAsync).not.toHaveBeenCalled();
  });
});
