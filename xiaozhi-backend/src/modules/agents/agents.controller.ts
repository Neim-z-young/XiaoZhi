import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentExportDto } from './dto/agent-export.dto';
import { GenerateAgentDto } from './dto/generate-agent.dto';

@ApiTags('智能体管理')
@ApiBearerAuth()
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiOperation({ summary: '创建智能体' })
  create(@Body() createAgentDto: CreateAgentDto) {
    // TODO: 从 JWT 获取实际 userId
    return this.agentsService.create('default-user-id', createAgentDto);
  }

  @Get()
  @ApiOperation({ summary: '获取智能体列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
  ) {
    return this.agentsService.findAll('default-user-id', page || 1, pageSize || 20, keyword);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取智能体详情' })
  findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id, 'default-user-id');
  }

  @Put(':id')
  @ApiOperation({ summary: '更新智能体' })
  update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    return this.agentsService.update(id, 'default-user-id', updateAgentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除智能体' })
  remove(@Param('id') id: string) {
    return this.agentsService.remove(id, 'default-user-id');
  }

  @Post(':id/lock')
  @ApiOperation({ summary: '锁定智能体' })
  lock(@Param('id') id: string) {
    return this.agentsService.toggleLock(id, 'default-user-id', true);
  }

  @Post(':id/unlock')
  @ApiOperation({ summary: '解锁智能体' })
  unlock(@Param('id') id: string) {
    return this.agentsService.toggleLock(id, 'default-user-id', false);
  }

  @Get(':id/export')
  @ApiOperation({ summary: '导出智能体' })
  async exportAgent(@Param('id') id: string, @Res() res: Response) {
    const agent = await this.agentsService.findOne(id, 'default-user-id');
    if (!agent) {
      res.status(404).json({ message: '智能体不存在' });
      return;
    }
    const content = this.agentsService.exportAgent(agent);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(agent.name)}.txt"`);
    res.send(content);
  }

  @Post('import')
  @ApiOperation({ summary: '导入智能体' })
  async importAgent(@Body() body: { content: string }) {
    const result = await this.agentsService.importAgent('default-user-id', body.content);
    return result;
  }

  @Post('generate')
  @ApiOperation({ summary: '根据内容生成智能体配置（使用 AI）' })
  async generateAgent(@Body() dto: GenerateAgentDto) {
    const result = await this.agentsService.generateAgent(dto.content, dto.modelId);
    return result;
  }
}
