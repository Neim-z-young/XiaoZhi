import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

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
}
