import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ModelConfigService } from '../../config/model-config.service';
import { AIModelConfig } from '../../config/app-config.interface';

@ApiTags('模型管理')
@Controller('models')
export class ModelsController {
  constructor(private readonly modelConfigService: ModelConfigService) {}

  @Get()
  @ApiOperation({ summary: '获取所有模型列表' })
  getAllModels() {
    return {
      models: this.modelConfigService.getAllModels().map(m => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        maxTokens: m.maxTokens,
        temperature: m.temperature,
        enabled: m.enabled,
        hasApiKey: !!m.apiKey,
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
      provider: model.provider,
      baseURL: model.baseURL,
      maxTokens: model.maxTokens,
      temperature: model.temperature,
      enabled: model.enabled,
      hasApiKey: !!model.apiKey,
    };
  }

  @Post()
  @ApiOperation({ summary: '添加新模型' })
  addModel(@Body() body: AIModelConfig) {
    if (!body.apiKeyEnv && !body.apiKey) {
      return { error: 'Either apiKey or apiKeyEnv must be provided' };
    }
    
    // 如果配置了 apiKeyEnv，从环境变量读取
    if (body.apiKeyEnv && !body.apiKey) {
      body.apiKey = process.env[body.apiKeyEnv];
    }
    
    this.modelConfigService.addModel(body);
    return { success: true, model: body };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新模型配置' })
  updateModel(@Param('id') id: string, @Body() updates: Partial<AIModelConfig>) {
    // 如果更新时提供了 apiKeyEnv，重新读取环境变量
    if (updates.apiKeyEnv && !updates.apiKey) {
      updates.apiKey = process.env[updates.apiKeyEnv];
    }
    
    this.modelConfigService.updateModel(id, updates);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除模型' })
  deleteModel(@Param('id') id: string) {
    this.modelConfigService.removeModel(id);
    return { success: true };
  }

  @Post(':id/enable')
  @ApiOperation({ summary: '启用模型' })
  enableModel(@Param('id') id: string) {
    this.modelConfigService.updateModel(id, { enabled: true });
    return { success: true };
  }

  @Post(':id/disable')
  @ApiOperation({ summary: '禁用模型' })
  disableModel(@Param('id') id: string) {
    this.modelConfigService.updateModel(id, { enabled: false });
    return { success: true };
  }
}
