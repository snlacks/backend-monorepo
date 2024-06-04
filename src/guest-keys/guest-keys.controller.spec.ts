import { GuestKeysController } from './guest-keys.controller';
import { GuestKeysService } from './guest-keys.service';

describe('GuestKeysController', () => {
  let controller: GuestKeysController;
  let service: GuestKeysService;

  const testGuestKey = {
    guest_key_id: '1232456',
    email: 'test@test.com',
  };
  beforeEach(async () => {
    service = {
      count: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;
    controller = new GuestKeysController(service);
  });

  describe('#create', () => {
    it('should', async () => {
      controller.create(testGuestKey);
      expect(service.create).toHaveBeenCalledWith({
        email: testGuestKey.email,
      });
    });
  });

  describe('#findOne', () => {
    it('should', async () => {
      controller.findOne(testGuestKey.guest_key_id);
      expect(service.findOne).toHaveBeenCalledWith(testGuestKey.guest_key_id);
    });
  });

  describe('#remove', () => {
    it('should', async () => {
      controller.remove(testGuestKey.guest_key_id);
      expect(service.remove).toHaveBeenCalledWith(testGuestKey.guest_key_id);
    });
  });
});
