import { Controller, Get, Post as HttpPost, Param, Post } from '@nestjs/common';
import { ToolConfigService } from './tool-config.service';
import { Tool } from '../../entities/tool.entity';

@Controller('tools')
export class ToolController {
  constructor(private readonly toolConfigService: ToolConfigService) {}

  @Get()
  async findAll(): Promise<{ list: Tool[]; total: number }> {
    const list = await this.toolConfigService.findAll();
    return { list, total: list.length };
  }

  @Get('enabled')
  async findEnabled(): Promise<{ list: Tool[]; total: number }> {
    const list = await this.toolConfigService.findEnabled();
    return { list, total: list.length };
  }

  @HttpPost(':id/enable')
  async enable(@Param('id') id: string): Promise<Tool | null> {
    return this.toolConfigService.enable(id);
  }

  @HttpPost(':id/disable')
  async disable(@Param('id') id: string): Promise<Tool | null> {
    return this.toolConfigService.disable(id);
  }

  @Post('init')
  async init(): Promise<{ message: string }> {
    await this.toolConfigService.initBuiltinTools();
    return { message: 'Builtin tools initialized' };
  }
}
