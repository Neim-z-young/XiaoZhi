import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { McpServerService } from './mcp-server.service';
import { McpServer } from '../../entities/mcp-server.entity';

@ApiTags('MCP 服务器')
@Controller('mcp/servers')
export class McpController {
  constructor(private readonly mcpServerService: McpServerService) {}

  @Get()
  @ApiOperation({ summary: '获取所有 MCP 服务器' })
  async findAll(): Promise<McpServer[]> {
    return this.mcpServerService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个 MCP 服务器' })
  async findOne(@Param('id') id: string): Promise<McpServer | null> {
    return this.mcpServerService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建 MCP 服务器' })
  async create(@Body() data: Partial<McpServer>): Promise<McpServer> {
    return this.mcpServerService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新 MCP 服务器' })
  async update(
    @Param('id') id: string,
    @Body() data: Partial<McpServer>,
  ): Promise<McpServer | null> {
    return this.mcpServerService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除 MCP 服务器' })
  async delete(@Param('id') id: string): Promise<boolean> {
    return this.mcpServerService.delete(id);
  }

  @Post(':id/connect')
  @ApiOperation({ summary: '连接 MCP 服务器' })
  async connect(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    const server = await this.mcpServerService.findOne(id);
    if (!server) {
      return { success: false, message: 'Server not found' };
    }
    try {
      await this.mcpServerService.connectServer(server);
      return { success: true, message: 'Connected successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Post(':id/disconnect')
  @ApiOperation({ summary: '断开 MCP 服务器' })
  async disconnect(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.mcpServerService.disconnectServer(id);
      return { success: true, message: 'Disconnected successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Get(':id/tools')
  @ApiOperation({ summary: '获取 MCP 服务器工具列表' })
  async getTools(@Param('id') id: string): Promise<any[]> {
    return this.mcpServerService.getTools(id);
  }

  @Get('tools')
  @ApiOperation({ summary: '获取所有已启用 MCP 服务器的工具列表' })
  async getAllTools(): Promise<any[]> {
    return this.mcpServerService.getTools();
  }
}
