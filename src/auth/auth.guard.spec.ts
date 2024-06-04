import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { someToken } from './auth.mock';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let context: ExecutionContext;
  let jwtService: JwtService;
  let reflector: Reflector;
  const testUser = {
    username: 'test@test.com',
    phone_number: '+1123456789',
    roles: [],
  };
  let cookieSpy: Response['cookie'];
  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(() => ({ data: testUser })),
    } as any;
    cookieSpy = jest.fn();

    guard = new AuthGuard(jwtService, reflector);
    context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {},
          cookies: {
            Authorization: `Bearer%20${someToken()}; Path=/; HttpOnly; SameSite=Strict; Domain=localhost`,
          },
        }),
        getResponse: () => ({
          cookie: cookieSpy,
        }),
      }),
    } as any;
  });

  it('should succeed', async () => {
    expect.assertions(2);

    await guard.canActivate(context as any).then((d) => expect(d).toBe(true));
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      `Bearer%20${someToken()}; Path=/; HttpOnly; SameSite=Strict; Domain=localhost`,
      { secret: 'some secret' },
    );
  });
  it('should fail when user is not present on an otherwise signed token', async () => {
    guard = new AuthGuard(
      {
        ...jwtService,
        verifyAsync: () => ({
          data: undefined,
        }),
      } as any,
      reflector,
    );
    expect.assertions(1);
    await guard
      .canActivate(context as any)
      .catch((e) => expect(e.message).toBe('Unauthorized'));
  });
  it('should fail when unverifiable', async () => {
    guard = new AuthGuard(
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

  it('should fail when no token', async () => {
    guard = new AuthGuard(jwtService, reflector);
    expect.assertions(1);
    await guard
      .canActivate({
        ...context,
        switchToHttp: () => ({
          ...context.switchToHttp(),
          getRequest: () => ({ cookies: {} }),
        }),
      } as any)
      .catch((e) => expect(e.message).toBe('Unauthorized'));
  });
  it('should fail if no cookie set', async () => {
    guard = new AuthGuard(jwtService, reflector);
    expect.assertions(1);
    await guard
      .canActivate({
        ...context,
        switchToHttp: () => ({
          ...context.switchToHttp(),
          getResponse: () => ({ cookie: undefined }),
        }),
      } as any)
      .catch((e) => expect(e.message).toBe('Unauthorized'));
  });

  it('should pass on a public page even when there is no token', async () => {
    guard = new AuthGuard(jwtService, {
      getAllAndOverride: jest.fn(() => true),
    } as any);
    expect.assertions(1);
    await guard
      .canActivate({
        ...context,
        switchToHttp: () => ({
          ...context.switchToHttp(),
          getRequest: () => ({ cookies: {} }),
        }),
      } as any)
      .then((data) => expect(data).toBe(true));
  });
});
