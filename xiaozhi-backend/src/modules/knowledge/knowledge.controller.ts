import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';

@ApiTags('知识库')
@ApiBearerAuth()
@Controller('knowledge-bases')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  @ApiOperation({ summary: '创建知识库' })
  create(@Body() createDto: CreateKnowledgeBaseDto) {
    return this.knowledgeService.create('default-user-id', createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取知识库列表' })
  findAll() {
    return this.knowledgeService.findAll('default-user-id');
  }

  @Get(':id')
  @ApiOperation({ summary: '获取知识库详情' })
  findOne(@Param('id') id: string) {
    return this.knowledgeService.findOne(id, 'default-user-id');
  }

  @Put(':id')
  @ApiOperation({ summary: '更新知识库' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.knowledgeService.update(id, 'default-user-id', updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除知识库' })
  remove(@Param('id') id: string) {
    return this.knowledgeService.remove(id, 'default-user-id');
  }

  @Post(':id/search')
  @ApiOperation({ summary: 'RAG 检索' })
  search(
    @Param('id') id: string,
    @Body() body: { query: string; topK?: number },
  ) {
    return this.knowledgeService.search(id, 'default-user-id', body.query, body.topK);
  }
}
