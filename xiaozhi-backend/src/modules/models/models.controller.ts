import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ModelConfigService } from '../../config/model-config.service';
import { AIModelConfig } from '../../config/app-config.interface';
import { AIGatewayService } from '../ai/ai-gateway.service';

@ApiTags('模型管理')
@Controller('models')
export class ModelsController {
  constructor(
    private readonly modelConfigService: ModelConfigService,
    private readonly aiGatewayService: AIGatewayService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取所有模型列表' })
  getAllModels() {
    return {
      models: this.modelConfigService.getAllModelsWithSource().map(m => ({
        id: m.id,
        name: m.name,
        model: m.model,
        provider: m.provider,
        baseURL: m.baseURL,
        maxTokens: m.maxTokens,
        temperature: m.temperature,
        enabled: m.enabled,
        hasApiKey: !!m.apiKey,
        isPreset: m.isPreset,
      })),
    };
  }

  @Get('enabled')
  @ApiOperation({ summary: '获取已启用的模型列表' })
  getEnabledModels() {
    return {
      models: this.modelConfigService.getEnabledModels().map(m => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        maxTokens: m.maxTokens,
        temperature: m.temperature,
      })),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取模型详情' })
  getModel(@Param('id') id: string) {
    const model = this.modelConfigService.getModel(id);
    if (!model) {
      return { error: 'Model not found' };
    }
    return {
      id: model.id,
      name: model.name,
      model: model.model,
      provider: model.provider,
      baseURL: model.baseURL,
      maxTokens: model.maxTokens,
      temperature: model.temperature,
      enabled: model.enabled,
      hasApiKey: !!model.apiKey,
      isPreset: this.modelConfigService.isPresetModel(id),
    };
  }

  @Post()
  @ApiOperation({ summary: '添加新模型' })
  async addModel(@Body() body: AIModelConfig) {
    if (!body.apiKeyEnv && !body.apiKey) {
      return { success: false, error: 'Either apiKey or apiKeyEnv must be provided' };
    }
    
    // 如果配置了 apiKeyEnv，从环境变量读取
    if (body.apiKeyEnv && !body.apiKey) {
      body.apiKey = process.env[body.apiKeyEnv];
    }
    
    await this.modelConfigService.addModel(body);
    // 清除旧的 adapter，下次调用时会用新配置创建
    this.aiGatewayService.clearAdapter(body.id);
    return { success: true, message: 'Model added successfully (API key encrypted)' };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新模型配置' })
  async updateModel(@Param('id') id: string, @Body() updates: Partial<AIModelConfig>) {
    // 如果更新时提供了 apiKeyEnv，重新读取环境变量
    if (updates.apiKeyEnv && !updates.apiKey) {
      updates.apiKey = process.env[updates.apiKeyEnv];
    }
    
    const result = await this.modelConfigService.updateModel(id, updates);
    if (!result.success) {
      return result;
    }
    // 清除旧的 adapter，下次调用时会用新配置创建
    this.aiGatewayService.clearAdapter(id);
    return { success: true, message: 'Model updated successfully' };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除模型' })
  async deleteModel(@Param('id') id: string) {
    const result = await this.modelConfigService.removeModel(id);
    if (!result.success) {
      return result;
    }
    // 清除旧的 adapter
    this.aiGatewayService.clearAdapter(id);
    return { success: true };
  }

  @Post(':id/enable')
  @ApiOperation({ summary: '启用模型' })
  async enableModel(@Param('id') id: string) {
    await this.modelConfigService.enableModel(id);
    return { success: true };
  }

  @Post(':id/disable')
  @ApiOperation({ summary: '禁用模型' })
  async disableModel(@Param('id') id: string) {
    await this.modelConfigService.disableModel(id);
    return { success: true };
  }
}
