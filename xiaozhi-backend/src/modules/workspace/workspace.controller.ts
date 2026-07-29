import { Controller, Get, Post, Put, Delete, Body, Param, Post as HttpPost } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { Workspace } from '../../entities/workspace.entity';

@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  async findAll(): Promise<{ list: Workspace[]; total: number }> {
    const list = await this.workspaceService.findAll();
    return { list, total: list.length };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Workspace | null> {
    return this.workspaceService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<Workspace>): Promise<Workspace> {
    return this.workspaceService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<Workspace>,
  ): Promise<Workspace | null> {
    return this.workspaceService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.workspaceService.delete(id);
    return { success };
  }

  @HttpPost(':id/enable')
  async enable(@Param('id') id: string): Promise<Workspace | null> {
    return this.workspaceService.enable(id);
  }

  @HttpPost(':id/disable')
  async disable(@Param('id') id: string): Promise<Workspace | null> {
    return this.workspaceService.disable(id);
  }
}
