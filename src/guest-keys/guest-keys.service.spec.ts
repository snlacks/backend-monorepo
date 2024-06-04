import { GuestKeysService } from './guest-keys.service';
import { GuestKey } from './entities/guest-key.entity';
import { Repository } from 'typeorm';

describe('GuestKeysService', () => {
  let service: GuestKeysService;
  let repository: Repository<GuestKey>;

  const testGuestKey = {
    guest_key_id: '1232456',
    email: 'test@test.com',
  };

  beforeEach(async () => {
    repository = {
      count: jest.fn(),
      insert: jest.fn(() => ({ generatedMaps: [testGuestKey] })),
      findOneBy: jest.fn(() => testGuestKey),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    service = new GuestKeysService(repository);
  });

  describe('#create', () => {
    it('should', async () => {
      expect.assertions(2);
      service.create({ email: undefined });
      await expect(repository.insert).toHaveBeenCalled();
      service.create({ email: testGuestKey.email });
      await expect(repository.insert).toHaveBeenCalledTimes(2);
    });
  });
  describe('#findOne', () => {
    it('should', async () => {
      expect.assertions(1);
      await service.findOne(testGuestKey.guest_key_id);
      expect(repository.findOneBy).toHaveBeenCalledWith({
        guest_key_id: testGuestKey.guest_key_id,
      });
    });
  });

  describe('#delete', () => {
    it('should', async () => {
      expect.assertions(1);
      await service.remove(testGuestKey.guest_key_id);
      expect(repository.delete).toHaveBeenCalledWith({
        guest_key_id: testGuestKey.guest_key_id,
      });
    });
  });
});
