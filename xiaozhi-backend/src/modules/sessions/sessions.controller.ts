import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('会话管理')
@ApiBearerAuth()
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: '创建会话' })
  create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.create('default-user-id', createSessionDto);
  }

  @Get()
  @ApiOperation({ summary: '获取会话列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'agentId', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('agentId') agentId?: string,
  ) {
    return this.sessionsService.findAll('default-user-id', page || 1, pageSize || 20, agentId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取会话详情' })
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id, 'default-user-id');
  }

  @Put(':id')
  @ApiOperation({ summary: '更新会话' })
  update(@Param('id') id: string, @Body() updateSessionDto: any) {
    return this.sessionsService.update(id, 'default-user-id', updateSessionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除会话' })
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id, 'default-user-id');
  }

  @Get(':id/messages')
  @ApiOperation({ summary: '获取会话消息历史' })
  @ApiQuery({ name: 'before', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMessages(
    @Param('id') id: string,
    @Query('before') before?: string,
    @Query('limit') limit?: number,
  ) {
    return this.sessionsService.getMessages(id, 'default-user-id', before, limit);
  }
}
