import * as twilio from "twilio";
import { Injectable } from "@nestjs/common";
import TwilioClient from "twilio/lib/rest/Twilio";
import { checkEnv } from "../checkEnv";

@Injectable()
export class SmsService {
  client: TwilioClient;

  constructor() {
    checkEnv("TWILIO_AUTH_TOKEN");
    checkEnv("TWILIO_ACCOUNT_SID");
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
}
