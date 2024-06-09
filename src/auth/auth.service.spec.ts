import { Repository } from 'typeorm';
import { SmsService } from '../sms/sms.module.mock';
import { AuthService, hashOTP } from './auth.service';
import { OneTimePassword } from '../one-time-password/one-time-password.entity';
import { UsersService } from '../users/users.service';
import { addYears } from 'date-fns';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { jwtConfig } from '../_mock-data/jwt-config-data';

describe('AuthService', () => {
  let service: AuthService;
  let otpRepo: Repository<OneTimePassword>;
  let userService: UsersService;
  let smsService: SmsService;
  let jwtService: JwtService;

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
    otpRepo = {
      findOne: jest.fn(),
      delete: jest.fn(),
      insert: jest.fn(),
      findOneBy: jest.fn(async () => otpEntity),
    } as any;

    smsService = new SmsService();

    userService = {
      findOne: jest.fn(() => testUserWithRoles),
    } as any;

    jwtService = new JwtService(jwtConfig);

    service = new AuthService(userService, smsService, otpRepo, jwtService);
  });

  it('should be defined', () => {
    expect.assertions(1);
    expect(service).toBeDefined();
  });
  describe('#requestOTP', () => {
    it('should request a one time password', async () => {
      expect.assertions(4);
      expect(await service.requestOTP(testUser)).toStrictEqual({
        body: '',
        errorMessage: '',
        oneTimePassword: '######',
      });

      expect(userService.findOne).toHaveBeenCalledWith(testUser.username);
      expect(
        (otpRepo.insert as jest.Mock).mock.calls[0][0].username,
      ).toStrictEqual(testUser.username);
      expect(
        Object.keys((otpRepo.insert as jest.Mock).mock.calls[0][0]),
      ).toStrictEqual(['username', 'hash', 'salt', 'expiration']);
    });
    it('should throw when wrong user', async () => {
      expect.assertions(1);

      service = new AuthService(
        { ...userService, findOne: () => undefined } as any,
        smsService,
        otpRepo,
        jwtService,
      );

      await service
        .requestOTP({ username: 'notauser', phone_number: '+1234567890' })
        .catch((e) => {
          expect(e.message).toBe('Unauthorized');
        });
    });
  });

  describe('#signIn', () => {
    expect.assertions(1);
    it('should sign in', async () => {
      expect.assertions(1);
      await service
        .verifyOTP(testUser.username, testPass)
        .then((d) => expect(d.token.length).toBeGreaterThan(250));
    });

    it('should throw when wrong password', async () => {
      expect.assertions(1);
      await service.verifyOTP(testUser.username, 'wrongpass').catch((e) => {
        expect(e.message).toBe('Unauthorized');
      });
    });

    it('should throw when no user', async () => {
      expect.assertions(1);

      service = new AuthService(
        { ...userService, findOne: () => undefined } as any,
        new SmsService(),
        otpRepo,
        new JwtService(),
      );

      await service
        .verifyOTP(
          'notauser', // this is demonstrative, the service throws an error because UserService returns undefind
          testPass,
        )
        .catch((e) => {
          expect(e.message).toBe('Unauthorized');
        });
    });

    it('should throw when no user', async () => {
      expect.assertions(1);

      service = new AuthService(
        userService,
        new SmsService(),
        {
          ...otpRepo,
          findOneBy: jest.fn(async () => {
            return expiredEntity;
          }) as any,
        } as any,
        new JwtService(),
      );

      await service
        .verifyOTP(
          'notauser', // this is demonstrative, the service throws an error because UserService returns undefind
          testPass,
        )
        .catch((e) => {
          expect(e.message).toBe('Unauthorized');
        });
    });
  });
});
