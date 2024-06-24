import { Injectable } from "@nestjs/common";
import { ConnectService } from "./connect.service";

@Injectable()
export class SendService {
  constructor(private connectService: ConnectService) {
    // this.gmail = (await authorizeGmail()) as OAuth2Client;
  }

  send = async ({
    text,
    subject,
    html,
    to,
    from = "Info <info@stevenlacks.com>",
  }: {
    text: string;
    subject: string;
    html: string;
    to: string;
    from?: string;
  }) => {
    const options = {
      to,
      from,
      subject,
      text,
      html,
      textEncoding: "base64",
      headers: [
        { key: "X-Application-Developer", value: "Steven Lacks" },
        { key: "X-Application-Version", value: "v1.0.0.2" },
      ],
    };
    const messageId = await this.connectService.sendMail(options);
    return messageId;
  };
}
