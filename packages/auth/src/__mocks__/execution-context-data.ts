import { someToken } from '../auth/auth.mock';

export const AuthorizationCookie = `Bearer%20${someToken()}; Path=/; HttpOnly; SameSite=Strict; Domain=localhost`;

export const getExecutionContext = () =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        cookies: {
          Authorization: AuthorizationCookie,
        },
      }),
    }),
  }) as any;
