import { Injectable } from "@nestjs/common";
import { OllamaService } from "../ollama/ollama.service";

const modelfile = `
FROM llama2
SYSTEM "give an answer if you can give a correct honest answer."
`;

@Injectable({})
export class AiChatService {
  constructor(private readonly ollamaService: OllamaService) {
    this.ollamaService.create({
      model: "gemma:2b",
      modelfile,
    });
  }

  chat(message: string, stream?: true) {
    return this.ollamaService.chat({
      model: "gemma:2b",
      messages: [{ role: "assistant", content: message }],
      stream,
      options: { temperature: 0 },
    });
  }
}
