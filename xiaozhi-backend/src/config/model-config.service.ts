import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from './configuration';
import { AIModelConfig } from './app-config.interface';

@Injectable()
export class ModelConfigService {
  private readonly logger = new Logger(ModelConfigService.name);
  private modelConfigs: Map<string, AIModelConfig> = new Map();
  private defaultModelId: string;

  constructor(private configService: ConfigService) {
    this.loadModelConfigs();
  }

  private loadModelConfigs() {
    const modelsConfig = this.configService.get<any>('models');
    if (!modelsConfig) {
      this.logger.warn('No models config found, using defaults');
      return;
    }

    this.defaultModelId = modelsConfig.default || 'gpt-4o-mini';

    const enabledModels = modelsConfig.enabled || [];
    for (const model of enabledModels) {
      if (model.enabled) {
        // 如果配置了 apiKeyEnv，从环境变量读取
        if (model.apiKeyEnv && !model.apiKey) {
          model.apiKey = process.env[model.apiKeyEnv];
        }
        this.modelConfigs.set(model.id, model);
        this.logger.log(`Loaded model: ${model.id} (${model.provider})`);
      }
    }

    this.logger.log(`ModelConfigService initialized with ${this.modelConfigs.size} models`);
  }

  getModel(id: string): AIModelConfig | undefined {
    return this.modelConfigs.get(id);
  }

  getDefaultModel(): AIModelConfig | undefined {
    return this.modelConfigs.get(this.defaultModelId);
  }

  getAllModels(): AIModelConfig[] {
    return Array.from(this.modelConfigs.values());
  }

  getEnabledModels(): AIModelConfig[] {
    return this.getAllModels().filter(m => m.enabled);
  }

  addModel(config: AIModelConfig): void {
    this.modelConfigs.set(config.id, config);
    this.logger.log(`Added model: ${config.id}`);
  }

  updateModel(id: string, updates: Partial<AIModelConfig>): void {
    const existing = this.modelConfigs.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.modelConfigs.set(id, updated);
      this.logger.log(`Updated model: ${id}`);
    }
  }

  removeModel(id: string): void {
    this.modelConfigs.delete(id);
    this.logger.log(`Removed model: ${id}`);
  }

  isModelEnabled(id: string): boolean {
    const model = this.modelConfigs.get(id);
    return model?.enabled ?? false;
  }
}
