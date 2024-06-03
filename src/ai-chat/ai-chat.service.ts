import { Injectable } from '@nestjs/common';
import { OllamaService } from '../ollama/ollama.service';

@Injectable({})
export class AiChatService {
  constructor(private readonly ollamaService: OllamaService) {}
  chat(message: string, stream?: true) {
    return this.ollamaService.chat({
      model: 'gemma:7b',
      messages: [{ role: 'assistant', content: message }],
      options: { temperature: 1 },
      stream,
    });
  }
}
