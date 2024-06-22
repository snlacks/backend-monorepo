import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { someToken } from './auth.mock';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { testUser } from '../_mock-data/user-data';
import { UsersService } from '../users/users.service';
import TokenService from '../token/token.service';

export const AuthServiceMock = (props: Partial<AuthService> = {}) =>
  ({
    signIn: jest.fn(async () => ({
      user: testUser,
      token: `Bearer ${someToken()}`,
      device: someToken(),
    })),
    requestOTP: jest.fn(
      () =>
        new Promise((resolve) =>
          resolve({
            oneTimePassword: '123456',
            hash: 'some_hash',
            salt: 'some_salt',
          }),
        ),
    ),
    ...props,
    verifyOTP: jest.fn(() => ({
      user: testUser,
      token: `Bearer ${someToken()}`,
      device: someToken(),
    })),
  }) as unknown as AuthService;

describe('AuthController', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let tokenService: TokenService;
  let controller: AuthController;
  let response: Response;
  let request: Request;
  beforeEach(() => {
    authService = AuthServiceMock();
    usersService = {
      findAll: jest.fn(() => [testUser]),
      add: jest.fn(),
    } as any;
    tokenService = new TokenService({
      signAsync: jest.fn(() => {
        data: testUser;
      }),
      verifyAsync: jest.fn(() => ({})),
    } as any as JwtService);
    controller = new AuthController(authService, usersService, tokenService);

    response = {
      cookie: jest.fn(),
      send: jest.fn(),
      status: jest.fn(),
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
      await controller.requestOTP(testUser, response).then((d) => {
        expect(d).toBeUndefined();
        expect(authService.requestOTP).toHaveBeenCalledWith(testUser);
      });
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
        usersService,
        tokenService,
      );
      await controller
        .requestOTP(testUser, response)
        .catch((e) => expect(e.message).toBe('Unauthorized'));

      expect(authService.requestOTP).not.toHaveBeenCalled();
    });
  });
  describe('#verifyOTP', () => {
    it('should set two cookies', async () => {
      await controller.login(
        {
          username: testUser.username,
          one_time_password: '123456',
        },
        response,
        request,
      );
      expect(response.cookie).toHaveBeenCalledWith(
        TokenService.AUTHORIZATION_COOKIE_NAME,
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
      expect.assertions(1);
      await controller.refreshToken(request, response).then(() => {
        expect(response.send).toHaveBeenCalledWith(testUser);
      });
    });
  });

  describe('#getUsers', () => {
    it('should get all', async () => {
      expect(await controller.getUsers()).toStrictEqual([testUser]);
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('#addUser', () => {
    it('should add a user', async () => {
      const createUser = { ...testUser };
      const userWithPassword = { ...createUser, password: '1Ba!@xowow' };
      expect(
        await controller.addUser(userWithPassword, response),
      ).toBeUndefined();
      expect(usersService.add).toHaveBeenCalledWith(userWithPassword);
    });
  });
  describe('#devToken', () => {
    it('should add a user', async () => {
      expect.assertions(2);
      const tokenUser = { ...testUser, roles: [], user_id: '1234567' };
      expect(await controller.devToken(tokenUser, response)).toBeUndefined();
      expect(response.send).toHaveBeenCalled();
    });
  });
});
