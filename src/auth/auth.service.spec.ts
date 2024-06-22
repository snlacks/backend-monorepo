import { SmsService } from '../sms/sms.module.mock';
import { AuthService, hashOTP } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import TokenService from '../token/token.service';
import { someToken } from './auth.mock';
import { sendServiceMock } from '../mail/send.service.mock';
import SendService from '../mail/send.service';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UsersService;
  let smsService: SmsService;
  let sendService: SendService;

  const _jwtService = {
    signAsync: jest.fn(someToken),
    verifyAsync: jest.fn(() => ({ data: testUser })),
  } as unknown as JwtService;

  let tokenService: TokenService;

  const testUser = {
    username: 'test@test.com',
    phone_number: '+1123456789',
  };

  const testUserWithRoles = {
    ...testUser,
    roles: [{ role_id: 'USER' }],
  } as User;
  const testPass = '123456';
  const testSalt = 'salty';
  let testHash: string;
  let tokenOtp: string;
  const wrappedForCookies = {
    token: someToken(),
    device: `Bearer ${someToken()}`,
  };

  beforeAll(async () => {
    testHash = await hashOTP(testPass, testSalt);
    tokenOtp = testHash;
  });

  beforeEach(async () => {
    smsService = new SmsService();

    userService = {
      findOne: jest.fn(() => testUserWithRoles),
    } as any;

    sendService = sendServiceMock();

    tokenService = {
      ...new TokenService(_jwtService),
      getPayload: jest.fn(
        () =>
          ({
            data: { hash: testHash, salt: testSalt },
            exp: 9999999999,
          }) as any,
      ),
      getAuthorizationCookies: jest.fn(() => wrappedForCookies) as any,
    } as any;
    service = new AuthService(
      userService,
      smsService,
      tokenService,
      sendService,
    );
  });

  it('should be defined', () => {
    expect.assertions(1);
    expect(service).toBeDefined();
  });
  describe('#requestOTP', () => {
    it('should request a one time password', async () => {
      expect.assertions(3);
      const otpResponse = await service.requestOTP(testUser);
      expect(otpResponse).toHaveProperty('body');
      expect(otpResponse).toHaveProperty('oneTimePassword');

      expect(userService.findOne).toHaveBeenCalledWith(testUser.username);
    });
    it('should throw when wrong user', async () => {
      service = new AuthService(
        { ...userService, findOne: () => undefined } as any,
        smsService,
        tokenService,
        sendService,
      );

      await service
        .requestOTP({ username: 'notauser', phone_number: '+1234567890' })
        .catch((e) => {
          expect(e.message).toBe('Unauthorized');
        });
    });
  });

  describe('#signIn', () => {
    it('should sign in', async () => {
      await service.verifyOTP(testUser.username, tokenOtp, testPass).then((d) =>
        expect(d).toStrictEqual({
          user: testUserWithRoles,
          ...wrappedForCookies,
        }),
      );
    });

    it('should throw when wrong password', async () => {
      expect.assertions(1);
      await service
        .verifyOTP(testUser.username, tokenOtp, 'wrongpass')
        .catch((e) => {
          expect(e.message).toBe('Unauthorized');
        });
    });
  });

  it('should throw when no user', async () => {
    expect.assertions(1);

    service = new AuthService(
      { ...userService, findOne: () => undefined } as any,
      new SmsService(),
      tokenService,
      sendService,
    );

    await service
      .verifyOTP(
        'notauser', // this is demonstrative, the service throws an error because UserService returns undefind
        tokenOtp,
        testPass,
      )
      .catch((e) => {
        expect(e.message).toBe('Unauthorized');
      });
  });
});
