import { someToken } from '../auth/auth.mock';

export const getExecutionContext = () =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        cookies: {
          Authorization: `Bearer%20${someToken()}; Path=/; HttpOnly; SameSite=Strict; Domain=localhost`,
        },
      }),
    }),
  }) as any;
