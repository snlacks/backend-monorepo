import { Test } from '@nestjs/testing';
import { UsersHTTPController } from './users-http.controller';
import { UsersService } from './users.service';

describe('UserController', () => {
  const testUser = {
    username: 'test@test.com',
    phoneNumber: '+1123456789',
    roles: [],
  };
  let controller: UsersHTTPController;
  let usersService: UsersService;
  beforeEach(async () => {
    usersService = {
      findAll: jest.fn(() => [testUser]),
      add: jest.fn(),
    } as any;
    const module = await Test.createTestingModule({
      controllers: [UsersHTTPController],
      providers: [
        UsersService,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();
    controller = module.get(UsersHTTPController);
  });
  it('should get all', async () => {
    expect(await controller.getAll()).toStrictEqual([testUser]);
    expect(usersService.findAll).toHaveBeenCalled();
  });
  it('should add a user', async () => {
    expect(await controller.add(testUser)).toBeUndefined();
    expect(usersService.add).toHaveBeenCalledWith(testUser);
  });
});
