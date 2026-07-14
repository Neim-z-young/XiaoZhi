import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';

@ApiTags('工作区')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: '创建工作区' })
  create(@Body() createDto: { name: string; description?: string; rootPath: string }) {
    return this.workspacesService.create('default-user-id', createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取工作区列表' })
  findAll() {
    return this.workspacesService.findAll('default-user-id');
  }

  @Get(':id')
  @ApiOperation({ summary: '获取工作区详情' })
  findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(id, 'default-user-id');
  }

  @Put(':id')
  @ApiOperation({ summary: '更新工作区' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.workspacesService.update(id, 'default-user-id', updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除工作区' })
  remove(@Param('id') id: string) {
    return this.workspacesService.remove(id, 'default-user-id');
  }

  @Get(':id/files')
  @ApiOperation({ summary: '获取文件树' })
  getFileTree(@Param('id') id: string, @Query('path') path?: string) {
    return this.workspacesService.getFileTree(id, 'default-user-id', path);
  }

  @Get(':id/search')
  @ApiOperation({ summary: '搜索文件' })
  search(@Param('id') id: string, @Query('q') q: string) {
    return this.workspacesService.search(id, 'default-user-id', q);
  }
}
