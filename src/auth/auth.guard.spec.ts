import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { someToken } from './auth.mock';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import TokenService from '../token/token.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let context: ExecutionContext;
  let tokenService: TokenService;
  let reflector: Reflector;

  const _jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(() => ({ data: testUser })),
  } as unknown as JwtService;
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

    tokenService = new TokenService(_jwtService);
    cookieSpy = jest.fn();

    guard = new AuthGuard(tokenService, reflector);
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

  it.only('should succeed', async () => {
    jest.spyOn(tokenService, 'getPayload');
    await guard.canActivate(context as any).then((d) => {
      expect(d).toBe(true);
      expect(tokenService.getPayload).toHaveBeenCalledWith(
        `Bearer%20${someToken()}; Path=/; HttpOnly; SameSite=Strict; Domain=localhost`,
      );
    });
  });
  it('should fail when user is not present on an otherwise signed token', async () => {
    guard = new AuthGuard(
      new TokenService({
        ..._jwtService,
        verifyAsync: jest.fn(() => {
          undefined;
        }),
      } as unknown as JwtService),
      reflector,
    );
    expect.assertions(1);
    await guard
      .canActivate(context as any)
      .catch((e) => expect(e.message).toBe('Unauthorized'));
  });
  it('should fail when unverifiable', async () => {
    guard = new AuthGuard(
      new TokenService({
        ..._jwtService,
        verifyAsync: jest.fn(() => {
          throw '';
        }),
      } as unknown as JwtService),
      reflector,
    );
    expect.assertions(1);
    await guard
      .canActivate(context as any)
      .catch((e) => expect(e.message).toBe('Unauthorized'));
  });

  it('should fail when no token', async () => {
    guard = new AuthGuard(tokenService, reflector);
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
    guard = new AuthGuard(tokenService, reflector);
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
    guard = new AuthGuard(tokenService, {
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
