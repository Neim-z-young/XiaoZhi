import { Controller, Get, Post, Put, Delete, Body, Param, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PluginsService } from './plugins.service';
import { CreatePluginDto } from './dto/create-plugin.dto';

@ApiTags('插件管理')
@ApiBearerAuth()
@Controller('plugins')
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService) {}

  @Post()
  @ApiOperation({ summary: '安装插件' })
  install(@Body() createPluginDto: CreatePluginDto) {
    return this.pluginsService.install(createPluginDto.type, createPluginDto.config);
  }

  @Get()
  @ApiOperation({ summary: '获取插件列表' })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'enabled', required: false, type: Boolean })
  findAll(
    @Query('type') type?: string,
    @Query('enabled') enabled?: boolean,
  ) {
    return this.pluginsService.findAll(type, enabled);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取插件详情' })
  findOne(@Param('id') id: string) {
    return this.pluginsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新插件' })
  update(@Param('id') id: string, @Body() updatePluginDto: any) {
    return this.pluginsService.update(id, updatePluginDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '卸载插件' })
  remove(@Param('id') id: string) {
    return this.pluginsService.remove(id);
  }

  @Get(':id/tools')
  @ApiOperation({ summary: '获取插件工具列表' })
  getTools(@Param('id') id: string) {
    return this.pluginsService.getTools(id);
  }
}
