import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';

describe('UsersService', () => {
  const testUser = {
    username: 'test@test.com',
    phoneNumber: '+1123456789',
  };
  const testUserWithRoles = {
    ...testUser,
    roles: [{ role_id: 'USER' }],
  };
  let service: UsersService;
  let userRepo: Repository<User>;
  let userRoleRepo: Repository<Role>;

  beforeEach(async () => {
    userRepo = {
      find: jest.fn(() => [testUser]),
      findOneBy: jest.fn(() => testUserWithRoles),
      create: jest.fn(() => testUserWithRoles),
      insert: jest.fn(() => {
        raw: {
          insertedId: '12345';
        }
      }),
    } as unknown as Repository<User>;
    userRoleRepo = { insert: jest.fn() } as any;
    service = new UsersService(userRepo, userRoleRepo);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find user', async () => {
    expect.assertions(2);
    expect(await service.findOne(testUser.username)).toBe(testUserWithRoles);
    expect(userRepo.findOneBy).toHaveBeenCalledWith({
      username: testUser.username,
    });
  });

  it('should get users', async () => {
    expect.assertions(2);
    expect(await service.findAll()).toStrictEqual([testUser]);

    expect(userRepo.find).toHaveBeenCalledWith();
  });

  it('should not be able add user with same username', async () => {
    expect.assertions(1);
    await service
      .add(testUser)
      .catch((e) =>
        expect(e.message).toBe('Conflict, must use a unique username'),
      );
  });

  it('should add user', async () => {
    userRepo = {
      ...userRepo,
      findOneBy: jest.fn(() => null),
      create: jest.fn(() => testUserWithRoles),
      save: jest.fn(),
    } as any;

    service = new UsersService(userRepo, userRoleRepo);
    expect(await service.add(testUser)).toBeNull();
    expect(userRepo.findOneBy).toHaveBeenCalledWith({
      username: testUser.username,
    });
    expect(userRepo.create).toHaveBeenCalledWith(testUserWithRoles);
    expect(userRepo.save).toHaveBeenCalledWith(testUserWithRoles);
  });

  it('should throw when it fails to add', async () => {
    userRepo = {
      ...userRepo,
      findOneBy: jest.fn(() => null),
      create: jest.fn(() => testUserWithRoles),
      save: jest.fn(() => {
        throw new Error();
      }),
    } as any;

    service = new UsersService(userRepo, userRoleRepo);
    try {
      await service.add(testUser);
    } catch (e) {
      expect(e.message).toBe('Unknown');

      expect(userRepo.findOneBy).toHaveBeenCalledWith({
        username: testUser.username,
      });

      expect(userRepo.save).toHaveBeenCalledWith(testUserWithRoles);
      return;
    }
  });
});
