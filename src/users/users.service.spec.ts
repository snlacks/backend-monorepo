import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    service = new UsersService({
      find: jest.fn(),
      findOneBy: jest.fn(),
      insert: jest.fn(),
    } as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
