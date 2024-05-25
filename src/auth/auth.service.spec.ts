import { Repository } from 'typeorm';
import { SmsService } from '../sms/sms.module.mock';
import { AuthService, hashOTP } from './auth.service';
import { OneTimePassword } from '../one-time-password/one-time-password.entity';
import { UsersService } from 'src/users/users.service';
import { addYears } from 'date-fns';
import { someBadToken } from './auth.mock';

describe('AuthService', () => {
  let service: AuthService;
  let otpRepo: Repository<OneTimePassword>;
  let userService: UsersService;
  const testUser = {
    username: 'test@test.com',
    phoneNumber: '+1123456789',
  };

  const testPass = '123456';
  const testSalt = 'salty';
  let testHash: string;
  let otpEntity: OneTimePassword;
  let expiredEntity: OneTimePassword;

  beforeAll(async () => {
    testHash = await hashOTP(testPass, testSalt);
    otpEntity = {
      username: testUser.username,
      salt: testSalt,
      hash: testHash,
      expiration: addYears(new Date(), 1),
    };
    expiredEntity = {
      ...otpEntity,
      expiration: addYears(new Date(), -1),
    };
  });

  beforeEach(async () => {
    process.env.JWT_SECRET = 'somesecret';
    otpRepo = {
      findOne: jest.fn(),
      delete: jest.fn(),
      insert: jest.fn(),
      findOneBy: jest.fn(async () => otpEntity),
    } as any;

    userService = {
      findOne: jest.fn(() => testUser),
    } as any;

    service = new AuthService(userService, new SmsService(), otpRepo);
  });

  afterEach(() => {
    process.env.JWT_SECRET = undefined;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('#requestOTP', () => {
    it('should request a one time password', async () => {
      expect((await service.requestOTP(testUser.username)).length).toBe(6);

      expect(userService.findOne).toHaveBeenCalledWith(testUser.username);
      expect((otpRepo.insert as jest.Mock).mock.calls[0][0].username).toBe(
        testUser.username,
      );
      expect(
        Object.keys((otpRepo.insert as jest.Mock).mock.calls[0][0]),
      ).toStrictEqual(['username', 'hash', 'salt', 'expiration']);
    });
    it('should throw when wrong user', async () => {
      expect.assertions(1);

      service = new AuthService(
        { ...userService, findOne: () => undefined } as any,
        new SmsService(),
        otpRepo,
      );

      await service.requestOTP('notauser').catch((e) => {
        expect(e.message).toBe('Unauthorized');
      });
    });
  });

  describe('#signToken', () => {
    it('should sign a token', () => {
      expect(service.signToken(testUser.username).length).toBe(159);
    });
  });

  describe('#signIn', () => {
    it('should sign in', async () => {
      expect(await service.signIn(testUser.username, testPass)).toHaveLength(
        159,
      );
    });

    it('should throw when wrong password', async () => {
      expect.assertions(1);
      await service.signIn(testUser.username, 'wrongpass').catch((e) => {
        expect(e.message).toBe('Unauthorized');
      });
    });

    it('should throw when no user', async () => {
      expect.assertions(1);

      service = new AuthService(
        { ...userService, findOne: () => undefined } as any,
        new SmsService(),
        otpRepo,
      );

      await service
        .signIn(
          'notauser', // this is demonstrative, the service throws an error because UserService returns undefind
          testPass,
        )
        .catch((e) => {
          expect(e.message).toBe('Unauthorized');
        });
    });

    it('should throw when no user', async () => {
      expect.assertions(1);

      service = new AuthService(userService, new SmsService(), {
        ...otpRepo,
        findOneBy: jest.fn(async () => {
          return expiredEntity;
        }) as any,
      } as any);

      await service
        .signIn(
          'notauser', // this is demonstrative, the service throws an error because UserService returns undefind
          testPass,
        )
        .catch((e) => {
          expect(e.message).toBe('Unauthorized');
        });
    });
  });

  describe('#verify', () => {
    it('should verify a token', () => {
      expect(
        Object.keys(service.verifyToken(service.signToken(testUser.username))),
      ).toStrictEqual(['data', 'iat', 'exp']);
    });

    it('should throw when fails verify a token', () => {
      expect(() => service.verifyToken(someBadToken())).toThrow();
    });
  });
});
