import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MemoryService } from './memory.service';

@ApiTags('记忆系统')
@ApiBearerAuth()
@Controller('memory')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Get('config')
  @ApiOperation({ summary: '获取记忆系统配置' })
  getConfig() {
    return {
      embeddingProvider: this.memoryService.getEmbeddingProvider(),
    };
  }

  @Post('short-term')
  @ApiOperation({ summary: '写入短时记忆' })
  writeShortTerm(@Body() body: { sessionId: string; content: string; role: 'user' | 'assistant' | 'system' }) {
    return this.memoryService.writeShortTerm(body.sessionId, body.content, body.role);
  }

  @Get('short-term/:sessionId')
  @ApiOperation({ summary: '读取短时记忆' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  readShortTerm(@Param('sessionId') sessionId: string, @Query('limit') limit?: number) {
    return this.memoryService.readShortTerm(sessionId, limit);
  }

  @Delete('short-term/:sessionId')
  @ApiOperation({ summary: '清除短时记忆' })
  clearShortTerm(@Param('sessionId') sessionId: string) {
    return this.memoryService.clearShortTerm(sessionId);
  }

  @Post('long-term')
  @ApiOperation({ summary: '写入长时记忆' })
  writeLongTerm(@Body() body: { 
    userId: string; 
    agentId: string; 
    content: string; 
    sessionId?: string;
    memoryType?: string;
    metadata?: Record<string, any>;
  }) {
    return this.memoryService.writeLongTerm(
      body.userId, 
      body.agentId, 
      body.content, 
      body.sessionId,
      body.memoryType,
      body.metadata,
    );
  }

  @Get('long-term')
  @ApiOperation({ summary: '获取长时记忆列表' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'agentId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  getLongTermMemories(
    @Query('userId') userId: string,
    @Query('agentId') agentId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.memoryService.getLongTermMemories(userId, agentId, limit, offset);
  }

  @Post('long-term/search')
  @ApiOperation({ summary: '检索长时记忆' })
  searchLongTerm(@Body() body: { 
    userId: string; 
    agentId: string; 
    query: string; 
    topK?: number;
  }) {
    return this.memoryService.searchLongTerm(
      body.userId, 
      body.agentId, 
      body.query,
      body.topK,
    );
  }

  @Delete('long-term/:memoryId')
  @ApiOperation({ summary: '删除长时记忆' })
  deleteLongTerm(@Param('memoryId') memoryId: string, @Query('userId') userId: string) {
    return this.memoryService.deleteLongTerm(memoryId, userId);
  }

  @Post('consolidate')
  @ApiOperation({ summary: '总结短时记忆并写入长时记忆' })
  consolidate(@Body() body: { sessionId: string; agentId: string; userId: string }) {
    return this.memoryService.consolidate(body.sessionId, body.agentId, body.userId);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取记忆统计' })
  getMemoryStats(@Query('userId') userId: string, @Query('agentId') agentId: string) {
    return this.memoryService.getMemoryStats(userId, agentId);
  }
}
