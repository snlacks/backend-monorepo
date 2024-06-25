export const someToken = () =>
  'some_good_token1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoic25sYWNrcy4xQGdtYWlsLmNvbSIsImlhdCI6MTcxNjU5Mjg2NiwiZXhwIjoxNzE2NTk2NDY2fQ.coXvywSs3VbT_Ql0V-HlWVS1Xnw4pXNhGInE4WET33M';

export const someBadToken = () =>
  'some_bad_tokenI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoic25sYWNrcy4xQGdtYWlsLmNvbSIsImlhdCI6MTcxNjU5Mjg2NiwiZXhwIjoxNzE2NTk2NDY2fQ.coXvywSs3VbT_Ql0V-HlWVS1Xnw4pXNhGInE4WET33M';

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
