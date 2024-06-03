import { Body, Controller, Get, Res } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { Response } from 'express';

@Controller('ai-chat')
export class AiChatController {
  constructor(private aiChatService: AiChatService) {}

  @Get('/chat-stream')
  async chatStream(
    @Body() { message }: { message: string },
    @Res({ passthrough: true })
    res: Response,
  ) {
    const chatResponse = await this.aiChatService.chat(message, true);
    for await (const part of chatResponse as any) {
      res.write(JSON.stringify(part));
    }
    res.end();
  }
}
