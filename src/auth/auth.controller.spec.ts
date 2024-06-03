import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { someToken } from './auth.mock';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { testUser } from '../_mock-data/user-data';
import { jwtConfig } from '../_mock-data/jwt-config-data';

export const AuthServiceMock = (props: Partial<AuthService> = {}) =>
  ({
    signIn: jest.fn(async () => ({
      user: testUser,
      token: await new Promise<string>((resolve) => resolve(someToken())),
    })),
    requestOTP: jest.fn(() => new Promise((resolve) => resolve('123456'))),
    ...props,
  }) as unknown as AuthService;

describe('AuthController', () => {
  let jwtService: JwtService;
  let authService: AuthService;
  let controller: AuthController;
  let response: Response;
  let request: Request;
  beforeEach(() => {
    jwtService = new JwtService(jwtConfig);
    authService = AuthServiceMock();
    controller = new AuthController(authService, jwtService);
    response = {
      cookie: jest.fn(),
      send: jest.fn(),
    } as any;
    request = {
      cookies: { Authorization: someToken() },
      user: testUser,
    } as unknown as Request;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('#requestOTP', () => {
    it('should get a one time password', async () => {
      expect.assertions(2);
      expect(await controller.requestOTP(testUser)).toBeUndefined();
      expect(authService.requestOTP).toHaveBeenCalledWith(testUser);
    });

    it('should fail to get a one time password', async () => {
      expect.assertions(2);
      controller = new AuthController(
        {
          ...authService,
          requestOTP: () => {
            throw 'Oops';
          },
        } as any,
        jwtService,
      );
      await controller
        .requestOTP(testUser)
        .catch((e) => expect(e.message).toBe('Unauthorized'));

      expect(authService.requestOTP).not.toHaveBeenCalled();
    });
  });
  describe('#signin', () => {
    it('should signin', async () => {
      await controller.signIn(
        {
          username: testUser.username,
          oneTimePassword: '123456',
        },
        response,
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'Authorization',
        `Bearer ${someToken()}`,
        {
          httpOnly: true,
          sameSite: 'strict',
        },
      );
    });
  });

  describe('#refreshToken,/refresh', () => {
    it('should verify and refresh', async () => {
      await controller.refreshToken(request, response);
      expect(response.cookie).toHaveBeenCalled();
      expect(response.send).toHaveBeenCalledWith(testUser);
    });
  });
});
