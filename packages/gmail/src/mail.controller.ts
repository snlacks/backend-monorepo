import { Controller, Post } from "@nestjs/common";
import { SendService } from "./send.service";

@Controller("/mail")
export class MailController {
  constructor(private sendService: SendService) {}

  @Post("/healthcheck")
  async send() {
    const date = new Date();
    const messageId = await this.sendService.send({
      text: `Hi!${date}`,
      subject: `Test Subject!${date}`,
      html: `<h1>Hi!${date}</h1>`,
      to: "snlacks@gmail.com",
    });
    return messageId;
  }
}
