import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SystemService } from './system.service';

@ApiTags('系统')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  getHealth() {
    return this.systemService.getHealth();
  }

  @Get('models')
  @ApiOperation({ summary: '获取模型列表' })
  getModels() {
    return this.systemService.getModels();
  }

  @Get('stats')
  @ApiOperation({ summary: '获取系统统计' })
  getStats() {
    return this.systemService.getStats();
  }
}
