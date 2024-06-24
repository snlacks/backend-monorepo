import { Repository } from "typeorm";
import { UsersService } from "./users.service";
import { User } from "./user.entity";
import { Password } from "./password.entity";

describe("UsersService", () => {
  const testUser = {
    username: "test@test.com",
    phone_number: "+1123456789",
    password: "S+r0nGxo@$",
  };
  const testUserWithRoles = {
    ...testUser,
    roles: [{ role_id: "USER" }],
  };
  const testUserInserted = { user_id: "some_id", ...testUserWithRoles };
  const testPassword = {
    hash: "51095db2e39071770c5a58347d023dea292b7ec50d22f87163a2859f3071e56d686e879fac075e2704e0b081a2be5728f8de75436d270beed439b0467b074870",
    salt: "66272c15a954d5fa382515eda57ab3da",
    expiration: "2050-06-07T12:00:54-04:00",
  };
  let service: UsersService;
  let userRepo: Repository<User>;
  let passwordRepo: Repository<Password>;

  beforeEach(async () => {
    userRepo = {
      find: jest.fn(() => [testUser]),
      findOneBy: jest.fn(() => testUserWithRoles),
      create: jest.fn(() => testUserWithRoles),
      insert: jest.fn(() => {
        raw: {
          insertedId: "12345";
        }
      }),
    } as unknown as Repository<User>;
    passwordRepo = {
      create: jest.fn(() => testPassword),
      save: jest.fn(() => undefined),
      insert: jest.fn(),
    } as any;
    service = new UsersService(userRepo, passwordRepo);
  });

  it("should find user", async () => {
    expect.assertions(2);
    expect(await service.findOne(testUser.username)).toBe(testUserWithRoles);
    expect(userRepo.findOneBy).toHaveBeenCalledWith({
      username: testUser.username,
    });
  });

  it("should get users", async () => {
    expect.assertions(2);
    expect(await service.findAll()).toStrictEqual([testUser]);

    expect(userRepo.find).toHaveBeenCalledWith();
  });

  it("should not be able add user with same username", async () => {
    expect.assertions(1);
    await service
      .add(testUser)
      .catch((e) =>
        expect(e.message).toBe(
          "We can't verify that email, it might be invalid or already registered.",
        ),
      );
  });

  it("should add user", async () => {
    expect.assertions(4);
    userRepo = {
      ...userRepo,
      findOneBy: jest.fn(() => null),
      create: jest.fn(() => testUserWithRoles),
      save: jest.fn(() => testUserInserted),
    } as any;

    service = new UsersService(userRepo, passwordRepo);
    expect(await service.add(testUser)).toStrictEqual(testUserInserted);
    expect(userRepo.findOneBy).toHaveBeenCalledWith({
      username: testUser.username,
    });
    expect(userRepo.create).toHaveBeenCalledWith(testUserWithRoles);
    expect(userRepo.save).toHaveBeenCalledWith(testUserWithRoles);
  });

  it("should throw when it fails to add", async () => {
    expect.assertions(3);
    userRepo = {
      ...userRepo,
      findOneBy: jest.fn(() => null),
      create: jest.fn(() => testUserWithRoles),
      save: jest.fn(() => {
        throw new Error();
      }),
    } as any;

    service = new UsersService(userRepo, passwordRepo);
    try {
      await service.add(testUser);
    } catch (e) {
      expect(e.message).toBe("Unknown");

      expect(userRepo.findOneBy).toHaveBeenCalledWith({
        username: testUser.username,
      });

      expect(userRepo.save).toHaveBeenCalledWith(testUserWithRoles);
      return;
    }
  });
});
