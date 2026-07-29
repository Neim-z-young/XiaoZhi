import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AIRequest, AIResponse, AIStreamResponse } from './ai-adapter.interface';
import { AIAdapter } from './ai-adapter.interface';
import { ModelConfigService } from '../../config/model-config.service';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { ClaudeAdapter } from './adapters/claude.adapter';

@Injectable()
export class AIGatewayService implements OnModuleInit {
  private readonly logger = new Logger(AIGatewayService.name);
  private adapters = new Map<string, AIAdapter>();

  constructor(private modelConfigService: ModelConfigService) {}

  async onModuleInit() {
    await this.initializeAdapters();
  }

  private async initializeAdapters() {
    // 延迟初始化，等待 ModelConfigService 从数据库加载动态模型
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const models = this.modelConfigService.getAllModels();
    this.logger.log(`Initializing adapters, found ${models.length} models: ${models.map(m => `${m.id}(model=${m.model})`).join(', ')}`);
    
    for (const model of models) {
      this.createAdapter(model.id);
    }

    this.logger.log(`AIGatewayService initialized with ${this.adapters.size} adapters: ${Array.from(this.adapters.keys()).join(', ')}`);
  }

  private createAdapter(modelId: string): AIAdapter | null {
    const modelConfig = this.modelConfigService.getModel(modelId);
    if (!modelConfig) {
      this.logger.warn(`No model config found for: ${modelId}`);
      return null;
    }

    if (!modelConfig.apiKey) {
      this.logger.warn(`Model ${modelId} has no API key, skipping adapter creation`);
      return null;
    }

    let adapter: AIAdapter;
    
    if (modelConfig.provider === 'openai' || modelConfig.provider === 'vllm' || modelConfig.provider === 'custom') {
      adapter = new OpenAIAdapter(modelConfig);
    } else if (modelConfig.provider === 'anthropic') {
      adapter = new ClaudeAdapter(modelConfig);
    } else {
      this.logger.warn(`Unsupported provider for model ${modelId}: ${modelConfig.provider}`);
      return null;
    }

    // 同时用 id 和 model 注册 adapter
    this.adapters.set(modelId, adapter);
    if (modelConfig.model !== modelId) {
      this.adapters.set(modelConfig.model, adapter);
      this.logger.log(`Created adapter for ${modelId} (also registered as ${modelConfig.model})`);
    } else {
      this.logger.log(`Created adapter for ${modelId}`);
    }

    return adapter;
  }

  /**
   * 清除 adapter（配置更新后调用）
   */
  clearAdapter(modelId: string): void {
    const modelConfig = this.modelConfigService.getModel(modelId);
    this.adapters.delete(modelId);
    if (modelConfig && modelConfig.model !== modelId) {
      this.adapters.delete(modelConfig.model);
    }
    this.logger.log(`Cleared adapter for ${modelId}`);
  }

  async complete(request: AIRequest): Promise<AIResponse> {
    let adapter = this.adapters.get(request.model);
    
    // 如果不存在，尝试动态创建
    if (!adapter) {
      this.logger.log(`Adapter not found for ${request.model}, trying to create dynamically`);
      adapter = this.createAdapter(request.model) || undefined;
    }
    
    if (!adapter) {
      throw new Error(`No adapter available for model: ${request.model}`);
    }
    return adapter.complete(request);
  }

  async *stream(request: AIRequest): AsyncGenerator<AIStreamResponse> {
    let adapter = this.adapters.get(request.model);
    
    // 如果不存在，尝试动态创建
    if (!adapter) {
      this.logger.log(`Adapter not found for ${request.model}, trying to create dynamically`);
      adapter = this.createAdapter(request.model) || undefined;
    }
    
    if (!adapter) {
      throw new Error(`No adapter available for model: ${request.model}`);
    }
    yield* adapter.stream(request);
  }
}
