import { Injectable, Logger } from '@nestjs/common';
import { AIRequest, AIResponse, AIStreamResponse } from './ai-adapter.interface';
import { AIAdapter } from './ai-adapter.interface';
import { ModelConfigService } from '../../config/model-config.service';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { ClaudeAdapter } from './adapters/claude.adapter';

@Injectable()
export class AIGatewayService {
  private readonly logger = new Logger(AIGatewayService.name);
  private adapters = new Map<string, AIAdapter>();

  constructor(private modelConfigService: ModelConfigService) {
    this.initializeAdapters();
  }

  private initializeAdapters() {
    const models = this.modelConfigService.getAllModels();
    
    for (const model of models) {
      if (!model.apiKey) {
        this.logger.warn(`Model ${model.id} has no API key, skipping`);
        continue;
      }

      let adapter: AIAdapter;
      
      if (model.provider === 'openai') {
        adapter = new OpenAIAdapter(model);
      } else if (model.provider === 'anthropic') {
        adapter = new ClaudeAdapter(model);
      } else {
        this.logger.warn(`Unsupported provider for model ${model.id}: ${model.provider}`);
        continue;
      }

      this.adapters.set(model.id, adapter);
      this.logger.log(`Initialized adapter for ${model.id}`);
    }

    this.logger.log(`AIGatewayService initialized with ${this.adapters.size} adapters`);
  }

  async complete(request: AIRequest): Promise<AIResponse> {
    const adapter = this.adapters.get(request.model);
    if (!adapter) {
      throw new Error(`No adapter available for model: ${request.model}`);
    }
    return adapter.complete(request);
  }

  async *stream(request: AIRequest): AsyncGenerator<AIStreamResponse> {
    const adapter = this.adapters.get(request.model);
    if (!adapter) {
      throw new Error(`No adapter available for model: ${request.model}`);
    }
    yield* adapter.stream(request);
  }

  getSupportedModels(): string[] {
    return Array.from(this.adapters.keys());
  }

  getModelConfigs() {
    return this.modelConfigService.getAllModels().map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      maxTokens: m.maxTokens,
      temperature: m.temperature,
      enabled: m.enabled,
    }));
  }

  isModelAvailable(modelId: string): boolean {
    return this.adapters.has(modelId);
  }
}
