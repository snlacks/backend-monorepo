import * as request from 'supertest';
import { AuthGuard } from '../src/auth/auth.guard';
import { AuthorizationCookie } from '../src/_mock-data/execution-context-data';

const validPhone = '+15005550006';
const host = 'http://localhost:3000';
const epoch = new Date(0);
const adminUser = {
  user_id: 'some_id',
  username: 'fake@email.com',
  phone_number: validPhone,
  roles: [
    {
      role_id: 'ADMIN',
      role_name: 'admin',
    },
    {
      role_id: 'USER',
      role_name: 'user',
    },
  ],
};

const requestOtpUser = {
  username: 'fake+1@email.com',
  phone_number: validPhone,
};

const createUserDto = {
  ...requestOtpUser,
  password: '1b!o__llAZ_',
};

describe('AuthController (e2e)', () => {
  let newUserID: string;
  let adminCookie: any;

  beforeAll(async () => {
    await request(host)
      .post('/auth/dev-token')
      .send(adminUser)
      .then((d) => {
        adminCookie = d.text;
      });
  });

  afterEach(async () => {
    await request(host)
      .delete('/auth/users/' + newUserID)
      .set('Cookie', [`${AuthGuard.AUTHORIZATION_COOKIE_NAME}=${adminCookie}`])
      .catch(console.error);
  });

  it('SMS Request OTP - Dev Token -> Guest Key -> Create -> Request', async () => {
    const keyResponse = await request(host)
      .post('/guest-keys')
      .set('Cookie', [`${AuthGuard.AUTHORIZATION_COOKIE_NAME}=${adminCookie}`])
      .expect(201);

    expect(keyResponse.body).toHaveProperty('guest_key_id');

    const userResponse = await request(host)
      .post('/auth/users')
      .send({ ...createUserDto, guest_key_id: keyResponse.body.guest_key_id })
      .expect(201);

    newUserID = userResponse.body.user_id;

    const otpResponse = await request(host)
      .post('/auth/request-otp')
      .send(createUserDto)
      .expect(201);

    expect((otpResponse as any).body.oneTimePassword).toHaveLength(6);
    expect((otpResponse as any).body.errorMessage).toBeNull();
    expect((otpResponse as any).body.body).toMatch(
      /Your one-time passcode is ######/,
    );
  });

  it('/auth/sign-out (POST)', async () => {
    await request('http://localhost:3000')
      .post('/auth/sign-out')
      .set('Cookie', [
        `${AuthGuard.AUTHORIZATION_COOKIE_NAME}=${AuthorizationCookie}`,
      ])
      .expect(200)
      .expect(
        'set-cookie',
        `${
          AuthGuard.AUTHORIZATION_COOKIE_NAME
        }=; Path=/; Expires=${epoch.toUTCString()}`,
      );
  });
});
