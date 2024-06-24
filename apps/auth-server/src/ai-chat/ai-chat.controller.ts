import { Body, Controller, Post, Res } from "@nestjs/common";
import { AiChatService } from "./ai-chat.service";
import { Response } from "express";

@Controller("ai-chat")
export class AiChatController {
  constructor(private aiChatService: AiChatService) {}

  @Post("/chat-stream")
  async chatStream(
    @Body() { message }: { message: string },
    @Res({ passthrough: true })
    res: Response,
  ) {
    const chatResponse = await this.aiChatService.chat(message, true);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    for await (const part of chatResponse) {
      res.write(part.message.content);
    }
    res.end();
  }
}
