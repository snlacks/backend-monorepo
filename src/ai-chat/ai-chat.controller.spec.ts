import { Response } from 'express';
import { OllamaService } from '../ollama/ollama.service';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';

const part = { message: { content: 'hi' } };
const sentPart = JSON.stringify(part);

describe('AiChatController', () => {
  let controller: AiChatController;
  let res: Response;
  beforeEach(() => {
    controller = new AiChatController(
      new AiChatService({
        chat: jest.fn(() => [part]),
      } as unknown as OllamaService),
    );
    res = { write: jest.fn(), end: jest.fn() } as unknown as Response;
  });

  it('should load', async () => {
    expect(
      await controller.chatStream({ message: 'What color is an orange?' }, res),
    ).toBeUndefined();

    expect(res.write).toHaveBeenCalledWith(sentPart);
  });
});
