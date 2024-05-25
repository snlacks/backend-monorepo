import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UserController', () => {
  const testUser = {
    username: 'test@test.com',
    phoneNumber: '+1123456789',
  };
  let controller: UsersController;
  let usersService: UsersService;
  beforeEach(() => {
    usersService = {
      findAll: jest.fn(() => [testUser]),
      add: jest.fn(),
    } as any;
    controller = new UsersController(usersService);
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
