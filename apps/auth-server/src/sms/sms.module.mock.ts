import { Injectable, Module } from "@nestjs/common";
import TwilioClient from "twilio/lib/rest/Twilio";

@Injectable()
export class SmsService {
  client: TwilioClient;

  constructor() {
    this.client = {
      messages: {
        create: jest
          .fn()
          .mockImplementation(
            () =>
              new Promise<{ errorMessage: string; body: string }>((resolve) =>
                resolve({ errorMessage: "", body: "" }),
              ),
          ),
      },
    } as unknown as TwilioClient;
  }
}

@Module({
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
