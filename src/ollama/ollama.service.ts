import { Injectable } from '@nestjs/common';
import { Ollama } from 'ollama';

@Injectable()
export class OllamaService extends Ollama {}
