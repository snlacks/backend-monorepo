import { Module } from '@nestjs/common';
import { Ollama } from 'ollama';
import { OllamaService } from './ollama.service';

const ollama = new Ollama({ host: 'http://localhost:11434' });

@Module({
  providers: [
    {
      provide: OllamaService,
      useValue: ollama,
    },
  ],
  exports: [OllamaService],
})
export class OllamaModule {}
