import { AuthController } from './auth.controller';
import { someToken } from './auth.mock';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

export const AuthServiceMock = (props: Partial<AuthService> = {}) =>
  ({
    signIn: jest.fn(
      () => new Promise<string>((resolve) => resolve(someToken())),
    ),
    requestOTP: jest.fn(() => new Promise((resolve) => resolve('123456'))),
    signToken: jest.fn(() => someToken()),
    verifyToken: jest.fn(() => ({
      data: 'theusername',
    })),
    ...props,
  }) as unknown as AuthService;

describe('AuthController', () => {
  const testUser = {
    username: 'test@test.com',
    phoneNumber: '+1123456789',
  };

  let service: AuthService;
  let controller: AuthController;
  let response: Response;
  let request: Request;
  beforeEach(() => {
    service = AuthServiceMock();
    controller = new AuthController(service);
    response = {
      cookie: jest.fn(),
      send: jest.fn(),
    } as any;
    request = { cookies: { Authenticate: someToken() } } as unknown as Request;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  it('should get a one time password', async () => {
    expect(await controller.requestOTP(testUser)).toBe('123456');
    expect(service.requestOTP).toHaveBeenCalledWith(testUser.username);
  });

  it('should signin', async () => {
    await controller.signIn(
      {
        username: testUser.username,
        oneTimePassword: '123456',
      },
      response,
    );
    expect(response.cookie).toHaveBeenCalledWith('Authenticate', someToken(), {
      httpOnly: true,
      sameSite: 'strict',
    });
  });
  it('should verify and refresh', async () => {
    await controller.verify(request, response);
    expect(service.verifyToken).toHaveBeenCalledWith(someToken());
    expect(response.cookie).toHaveBeenCalled();
    expect(response.send).toHaveBeenCalledWith({ success: true });
  });
});
