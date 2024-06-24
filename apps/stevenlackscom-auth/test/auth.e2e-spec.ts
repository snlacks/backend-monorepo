import * as request from "supertest";
import { AuthorizationCookie } from "@snlacks/auth/src/__mock__/execution-context-data";
import { TokenService } from "@snlacks/token";

const validPhone = "+15005550006";
const host = "http://localhost:3000";
const adminUser = {
  user_id: "some_id",
  username: "fake@email.com",
  phone_number: validPhone,
  roles: [
    {
      role_id: "ADMIN",
      role_name: "admin",
    },
    {
      role_id: "USER",
      role_name: "user",
    },
  ],
};

const requestOtpUser = {
  username: "fake+1@email.com",
  phone_number: validPhone,
};

const createUserDto = {
  ...requestOtpUser,
  password: "1b!o__llAZ_",
};

describe("AuthController (e2e)", () => {
  let newUserID: string;
  let adminCookie: any;

  beforeAll(async () => {
    await request(host)
      .post("/auth/dev-token")
      .send(adminUser)
      .then((d) => {
        adminCookie = d.text;
      });
  });

  afterEach(async () => {
    await request(host)
      .delete("/auth/users/" + newUserID)
      .set("Cookie", [
        `${TokenService.AUTHORIZATION_COOKIE_NAME}=${adminCookie}`,
      ])
      .catch(console.error);
  });

  it("SMS Request OTP - Dev Token -> Create -> Request", async () => {
    const userResponse = await request(host)
      .post("/auth/users")
      .send(createUserDto)
      .expect(201);

    newUserID = userResponse.body.user_id;

    await request(host)
      .post("/auth/request-otp")
      .send(createUserDto)
      .expect(201);
  });

  it("/auth/sign-out (POST)", async () => {
    await request("http://localhost:3000")
      .post("/auth/sign-out")
      .set("Cookie", [
        `${TokenService.AUTHORIZATION_COOKIE_NAME}=${AuthorizationCookie}`,
      ])
      .expect(200)
      .expect(
        "set-cookie",
        "Authorization=; Domain=localhost; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict",
      );
  });
});
