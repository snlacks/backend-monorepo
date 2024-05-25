import * as twilio from 'twilio';
import { Injectable } from '@nestjs/common';
import TwilioClient from 'twilio/lib/rest/Twilio';

@Injectable()
export class SmsService {
  client: TwilioClient;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }
}
