import { SmsService } from './sms.service';

describe('SmsService', () => {
  it('should load', () => {
    const service = new SmsService();

    expect(service.client).not.toBeUndefined();
  });
});
