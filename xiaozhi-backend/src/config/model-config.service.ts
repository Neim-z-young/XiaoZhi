import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from './configuration';
import { AIModelConfig } from './app-config.interface';
import { Model } from '../entities/model.entity';
import { encrypt, decrypt } from '../common/encryption';

@Injectable()
export class ModelConfigService implements OnModuleInit {
  private readonly logger = new Logger(ModelConfigService.name);
  private modelConfigs: Map<string, AIModelConfig> = new Map();
  private defaultModelId: string;
  private presetModelIds: Set<string> = new Set(); // 预制模型 ID

  constructor(
    private configService: ConfigService,
    @InjectRepository(Model)
    private modelRepository: Repository<Model>,
  ) {}

  async onModuleInit() {
    await this.loadModelConfigs();
  }

  private async loadModelConfigs() {
    // 1. 从 config.yaml 加载静态配置（预制模型）
    const modelsConfig = this.configService.get<any>('models');
    this.defaultModelId = modelsConfig?.default || 'gpt-4o-mini';

    if (modelsConfig?.enabled) {
      for (const model of modelsConfig.enabled) {
        if (model.enabled) {
          // 如果配置了 apiKeyEnv，从环境变量读取
          if (model.apiKeyEnv && !model.apiKey) {
            model.apiKey = process.env[model.apiKeyEnv];
          }
          this.modelConfigs.set(model.id, model);
          this.presetModelIds.add(model.id);
          this.logger.log(`Loaded preset model from config: ${model.id}`);
        }
      }
    }

    // 2. 从数据库加载动态添加的模型
    try {
      const dbModels = await this.modelRepository.find();
      for (const dbModel of dbModels) {
        const config: AIModelConfig = {
          id: dbModel.id,
          name: dbModel.name,
          model: dbModel.model,
          provider: dbModel.provider as any,
          baseURL: dbModel.baseURL,
          apiKeyEnv: dbModel.apiKeyEnv,
          // 解密 API Key
          apiKey: dbModel.encryptedApiKey ? decrypt(dbModel.encryptedApiKey) : undefined,
          maxTokens: dbModel.maxTokens,
          temperature: dbModel.temperature,
          enabled: dbModel.enabled,
        };
        this.modelConfigs.set(config.id, config);
        this.logger.log(`Loaded model from DB: ${config.id}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to load models from DB: ${error.message}`);
    }

    this.logger.log(`ModelConfigService initialized with ${this.modelConfigs.size} models (${this.presetModelIds.size} preset)`);
  }

  private async saveToDatabase(config: AIModelConfig): Promise<void> {
    try {
      const existing = await this.modelRepository.findOne({ where: { id: config.id } });
      
      const modelData = {
        id: config.id,
        name: config.name,
        model: config.model,
        provider: config.provider,
        baseURL: config.baseURL,
        apiKeyEnv: config.apiKeyEnv,
        // 加密存储 API Key
        encryptedApiKey: config.apiKey ? encrypt(config.apiKey) : undefined,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        enabled: config.enabled,
      };

      if (existing) {
        await this.modelRepository.update(existing.id, modelData);
      } else {
        await this.modelRepository.save(modelData);
      }
    } catch (error) {
      this.logger.error(`Failed to save model to DB: ${error.message}`);
    }
  }

  private async deleteFromDatabase(id: string): Promise<void> {
    try {
      await this.modelRepository.delete(id);
    } catch (error) {
      this.logger.error(`Failed to delete model from DB: ${error.message}`);
    }
  }

  /**
   * 判断是否为预制模型
   */
  isPresetModel(id: string): boolean {
    return this.presetModelIds.has(id);
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

  /**
   * 获取模型列表，包含是否为预制模型的标记
   */
  getAllModelsWithSource(): Array<AIModelConfig & { isPreset: boolean }> {
    return Array.from(this.modelConfigs.values()).map(m => ({
      ...m,
      isPreset: this.presetModelIds.has(m.id),
    }));
  }

  async addModel(config: AIModelConfig): Promise<void> {
    // 如果配置了 apiKeyEnv，从环境变量读取
    if (config.apiKeyEnv && !config.apiKey) {
      config.apiKey = process.env[config.apiKeyEnv];
    }
    // 如果 model 未指定，使用 id
    if (!config.model) {
      config.model = config.id;
    }
    this.modelConfigs.set(config.id, config);
    await this.saveToDatabase(config);
    this.logger.log(`Added model: ${config.id}`);
  }

  async updateModel(id: string, updates: Partial<AIModelConfig>): Promise<{ success: boolean; error?: string }> {
    // 预制模型不能修改（只能启用/禁用）
    if (this.presetModelIds.has(id)) {
      // 只允许更新 enabled 状态
      const allowedUpdates: Partial<AIModelConfig> = {};
      if (updates.enabled !== undefined) {
        allowedUpdates.enabled = updates.enabled;
      }
      if (Object.keys(allowedUpdates).length > 0) {
        const existing = this.modelConfigs.get(id);
        if (existing) {
          const updated = { ...existing, ...allowedUpdates };
          this.modelConfigs.set(id, updated);
        }
      }
      return { success: false, error: 'Preset models cannot be modified (only enable/disable allowed)' };
    }

    const existing = this.modelConfigs.get(id);
    if (existing) {
      // 如果更新时提供了 apiKeyEnv，重新读取环境变量
      if (updates.apiKeyEnv && !updates.apiKey) {
        updates.apiKey = process.env[updates.apiKeyEnv];
      }
      const updated = { ...existing, ...updates };
      this.modelConfigs.set(id, updated);
      await this.saveToDatabase(updated);
      this.logger.log(`Updated model: ${id}`);
      return { success: true };
    }
    return { success: false, error: 'Model not found' };
  }

  async removeModel(id: string): Promise<{ success: boolean; error?: string }> {
    // 预制模型不能删除
    if (this.presetModelIds.has(id)) {
      return { success: false, error: 'Preset models cannot be deleted' };
    }

    this.modelConfigs.delete(id);
    await this.deleteFromDatabase(id);
    this.logger.log(`Removed model: ${id}`);
    return { success: true };
  }

  async enableModel(id: string): Promise<void> {
    await this.updateModel(id, { enabled: true });
  }

  async disableModel(id: string): Promise<void> {
    await this.updateModel(id, { enabled: false });
  }

  isModelEnabled(id: string): boolean {
    const model = this.modelConfigs.get(id);
    return model?.enabled ?? false;
  }
}
