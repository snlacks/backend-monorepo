import { ConnectService } from "./connect.service";
import { SendService } from "./send.service";

export const connectService = {
  getGmailService: jest.fn(
    () =>
      ({
        users: {
          message: {
            send: jest.fn(() => new Promise((resolve) => resolve({}))),
          },
        },
      }) as any
  ),
  encodeMessage: jest.fn(() => "some_encoded_message"),
  createMail: jest.fn(() => "some_encoded_message"),
  sendMail: jest.fn(),
} as any as ConnectService;

export const sendServiceMock = () => new SendService(connectService);
