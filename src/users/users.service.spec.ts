import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersService', () => {
  const testUser = {
    username: 'test@test.com',
    phoneNumber: '+1123456789',
  };
  let service: UsersService;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    userRepo = {
      find: jest.fn(() => [testUser]),
      findOneBy: jest.fn(() => testUser),
      insert: jest.fn(),
    } as any;
    service = new UsersService(userRepo);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find user', async () => {
    expect(await service.findOne(testUser.username)).toBe(testUser);
    expect(userRepo.findOneBy).toHaveBeenCalledWith({
      username: testUser.username,
    });
  });

  it('should get users', async () => {
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
    } as any;

    service = new UsersService(userRepo);
    expect(await service.add(testUser)).toBeNull();
    expect(userRepo.findOneBy).toHaveBeenCalledWith({
      username: testUser.username,
    });
    expect(userRepo.insert).toHaveBeenCalledWith(testUser);
  });

  it('should theow when it fails to add', async () => {
    expect.assertions(3);
    userRepo = {
      ...userRepo,
      findOneBy: jest.fn(() => null),
      insert: jest.fn(() => {
        throw new Error();
      }),
    } as any;

    service = new UsersService(userRepo);
    service.add(testUser).catch((e) => {
      expect(e.message).toBe('Unknown');

      expect(userRepo.findOneBy).toHaveBeenCalledWith({
        username: testUser.username,
      });
      expect(userRepo.insert).toHaveBeenCalledWith(testUser);
    });
  });
});
