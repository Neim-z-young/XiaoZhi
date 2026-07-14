import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config/configuration';

@Injectable()
export class SystemService {
  constructor(private readonly configService: ConfigService) {}

  getHealth() {
    return {
      status: 'ok',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }

  getModels() {
    const models = this.configService.get('models.list') || [];
    const defaultModel = this.configService.get('models.default') || 'gpt-4o-mini';
    return {
      default: defaultModel,
      list: models,
    };
  }

  getStats() {
    // TODO: 返回实际统计数据
    return {
      sessions: 0,
      agents: 0,
      messages: 0,
      plugins: 0,
    };
  }
}
