import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { someToken } from './auth.mock';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { testUser } from '../__mocks__/user-data';
import { TokenService } from '@snlacks/token';
import { UsersService } from '../users/users.service';
const testOTP = {
  oneTimePassword: {
    oneTimePassword: '123456',
    hash: 'some_hash',
    salt: 'some_salt',
  },
};
export const AuthServiceMock = (props: Partial<AuthService> = {}) =>
  ({
    signIn: jest.fn(async () => ({
      user: testUser,
      token: `Bearer ${someToken()}`,
      device: someToken(),
    })),
    requestOTP: jest.fn(() => new Promise((resolve) => resolve(testOTP))),
    loginPasswordOnly: jest.fn(() => {
      return {
        oneTimePassword: {
          oneTimePassword: '123456',
          hash: 'some_hash',
          salt: 'some_salt',
        },
      };
    }),
    sendEmail: jest.fn(() => testOTP),
    verifyOTP: jest.fn(() => ({
      user: testUser,
      token: `Bearer ${someToken()}`,
      device: 'some_user_id',
    })),
    ...props,
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
      remove: jest.fn(),
      changePassword: jest.fn(),
    } as any;
    tokenService = new TokenService({
      signAsync: jest.fn(() => ({
        data: testUser,
      })),
      verifyAsync: jest.fn(() => ({})),
    } as any as JwtService);
    controller = new AuthController(authService, usersService, tokenService);

    response = {
      cookie: jest.fn(),
      send: jest.fn(),
      status: jest.fn(),
      clearCookie: jest.fn(),
    } as any;
    request = {
      cookies: {
        [TokenService.AUTHORIZATION_COOKIE_NAME]: `Bearer ${someToken()}`,
        [TokenService.LOGIN_NAME]: someToken(),
      },
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
        request,
        response,
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
  describe('#loginPassword', () => {
    it('should login', async () => {
      await controller.loginPassword(
        {
          username: testUser.username,
          password: '123456',
        },
        request,
        response,
      );
      expect(response.cookie).toHaveBeenCalledWith(
        TokenService.LOGIN_NAME,
        expect.anything(),
        expect.anything(),
      );
    });
    it('should login on known device', async () => {
      controller = new AuthController(
        {
          ...authService,
          loginPasswordOnly: jest.fn(() => ({
            ...testUser,
            user_id: 'some_user_id',
          })),
        } as any,
        usersService,
        {
          ...tokenService,
          verifyAsync: jest.fn(() => {
            return { data: { user_id: 'some_user_id' } };
          }),
          getAuthorizationCookies: jest.fn(() => {
            return new Promise((resolve) =>
              resolve({
                token: `Bearer ${someToken()}`,
                device: someToken(),
              }),
            );
          }),
        } as any,
      );
      await controller.loginPassword(
        {
          username: testUser.username,
          password: '123456',
        },
        {
          cookies: {
            KnownDevice: someToken(),
          },
          user: testUser,
        } as any as Request,
        response,
      );
      expect(response.cookie).toHaveBeenCalledWith(
        TokenService.AUTHORIZATION_COOKIE_NAME,
        expect.anything(),
        expect.anything(),
      );
      expect(response.cookie).toHaveBeenCalledWith(
        TokenService.DEVICE_COOKIE_NAME,
        expect.anything(),
        expect.anything(),
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
  describe('#signOut', () => {
    it('should add a user', async () => {
      expect(await controller.signOut(response)).toBeUndefined();
      expect(response.cookie).toHaveBeenCalledWith(
        TokenService.AUTHORIZATION_COOKIE_NAME,
        '',
        expect.anything(),
      );
    });
  });
  describe('#removeUser', () => {
    it('should add a user', async () => {
      expect(
        await controller.removeUser({ id: 'some_user_id' }, response),
      ).toBeUndefined();
      expect(usersService.remove).toHaveBeenCalledWith('some_user_id');
    });
  });
  describe('#updatePassword', () => {
    it('should add a user', async () => {
      const dto = {
        username: testUser.username,
        old_password: 'old_pass',
        new_password: 'new_pass',
      };
      expect(
        await controller.updatePassword({
          username: testUser.username,
          old_password: 'old_pass',
          new_password: 'new_pass',
        }),
      ).toBeUndefined();
      expect(usersService.changePassword).toHaveBeenCalledWith(dto);
    });
  });
});
