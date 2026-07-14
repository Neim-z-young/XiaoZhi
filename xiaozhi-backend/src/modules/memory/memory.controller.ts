import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MemoryService } from './memory.service';

@ApiTags('记忆系统')
@ApiBearerAuth()
@Controller('memory')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Post('short-term')
  @ApiOperation({ summary: '写入短时记忆' })
  writeShortTerm(@Body() body: { sessionId: string; content: string; role: 'user' | 'assistant' | 'system' }) {
    return this.memoryService.writeShortTerm(body.sessionId, body.content, body.role);
  }

  @Get('short-term/:sessionId')
  @ApiOperation({ summary: '读取短时记忆' })
  readShortTerm(@Param('sessionId') sessionId: string) {
    return this.memoryService.readShortTerm(sessionId);
  }

  @Post('long-term')
  @ApiOperation({ summary: '写入长时记忆' })
  writeLongTerm(@Body() body: { agentId: string; content: string; embedding: number[] }) {
    return this.memoryService.writeLongTerm('default-user-id', body.agentId, body.content, body.embedding);
  }

  @Post('long-term/search')
  @ApiOperation({ summary: '检索长时记忆' })
  searchLongTerm(@Body() body: { agentId: string; query: string; embedding: number[]; topK?: number }) {
    return this.memoryService.searchLongTerm('default-user-id', body.agentId, body.query, body.embedding, body.topK);
  }

  @Post('consolidate')
  @ApiOperation({ summary: '总结短时记忆写入长时' })
  consolidate(@Body() body: { sessionId: string; agentId: string }) {
    return this.memoryService.consolidate(body.sessionId, body.agentId);
  }
}
