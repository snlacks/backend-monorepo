import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { someToken } from '../auth/auth.mock';
import { RolesGuard } from './roles.guard';
import { getExecutionContext } from '../_mock-data/execution-context-data';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let context: ExecutionContext;
  let jwtService: JwtService;
  let reflector: Reflector;
  const testUser = {
    username: 'test@test.com',
    phoneNumber: '+1123456789',
    roles: [{ role_id: 'USER', role_name: 'user' }],
  };
  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(() => ['USER']),
    } as unknown as Reflector;
    jwtService = {
      verifyAsync: jest.fn(() => ({ data: testUser })),
    } as any;

    guard = new RolesGuard(jwtService, reflector);
    context = getExecutionContext();
  });
  it('should succeed', async () => {
    expect.assertions(2);

    await guard.canActivate(context as any).then((d) => expect(d).toBe(true));
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      `Bearer%20${someToken()}; Path=/; HttpOnly; SameSite=Strict; Domain=localhost`,
    );
  });

  it('should fail without user', async () => {
    guard = new RolesGuard(jwtService, reflector);
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
      {
        ...jwtService,
        verifyAsync: () => {
          throw 'Oops';
        },
      } as any,
      reflector,
    );
    expect.assertions(1);

    await guard
      .canActivate(context as any)
      .catch((e) => expect(e.message).toBe('Unauthorized'));
  });
  it('should succeed with no required roles', async () => {
    expect.assertions(2);

    reflector = {
      ...reflector,
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(jwtService, reflector);

    await guard.canActivate(context as any).then((d) => expect(d).toBe(true));
    expect(jwtService.verifyAsync).not.toHaveBeenCalledWith();
  });
  it('should succeed with no required roles, but receives an empty array of required roles', async () => {
    expect.assertions(2);

    reflector = {
      ...reflector,
      getAllAndOverride: jest.fn(() => undefined),
    } as any;
    guard = new RolesGuard(jwtService, reflector);

    await guard.canActivate(context as any).then((d) => expect(d).toBe(true));
    expect(jwtService.verifyAsync).not.toHaveBeenCalledWith();
  });
});
