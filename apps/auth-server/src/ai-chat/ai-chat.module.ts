import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { AiChatController } from "./ai-chat.controller";
import { AiChatService } from "./ai-chat.service";
import { OllamaModule } from "../ollama/ollama.module";

@Module({
  controllers: [AiChatController],
  imports: [HttpModule, OllamaModule],
  providers: [AiChatService],
})
export default class AiChatModule {}
