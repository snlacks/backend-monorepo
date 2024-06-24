import * as twilio from "twilio";
import { Injectable } from "@nestjs/common";
import TwilioClient from "twilio/lib/rest/Twilio";

const checkEnv = (name: string) => {
  if (!process.env[name]) {
    throw new Error(`${name} is a required Environmental Variable`);
  }
};
@Injectable()
export class SmsService {
  private client: TwilioClient;
  send = (sendProps: { body: string; to: string; from: string }) =>
    this.client.messages.create(sendProps);

  constructor() {
    checkEnv("TWILIO_AUTH_TOKEN");
    checkEnv("TWILIO_ACCOUNT_SID");
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
}
