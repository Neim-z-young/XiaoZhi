import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { McpServer } from '../../entities/mcp-server.entity';
import { McpClientService, McpClientConfig } from './mcp-client.service';
import { ConfigService } from '../../config/configuration';

@Injectable()
export class McpServerService implements OnModuleInit {
  private readonly logger = new Logger(McpServerService.name);

  constructor(
    @InjectRepository(McpServer)
    private readonly mcpServerRepo: Repository<McpServer>,
    private readonly mcpClient: McpClientService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // 从配置文件加载默认 MCP 服务器
    await this.loadDefaultServers();
    // 连接已启用的服务器
    await this.connectEnabledServers();
  }

  private async loadDefaultServers() {
    const configServers = this.configService.get<any>('mcp.servers') || [];
    
    for (const server of configServers) {
      const existing = await this.mcpServerRepo.findOne({ where: { id: server.id } });
      if (!existing) {
        await this.mcpServerRepo.save(this.mcpServerRepo.create({
          id: server.id,
          name: server.name,
          command: server.command,
          args: server.args,
          env: server.env,
          cwd: server.cwd,
          enabled: server.enabled || false,
        }));
        this.logger.log(`Loaded default MCP server: ${server.name}`);
      }
    }
  }

  private async connectEnabledServers() {
    const servers = await this.mcpServerRepo.find({ where: { enabled: true } });
    for (const server of servers) {
      try {
        await this.connectServer(server);
      } catch (error: any) {
        this.logger.error(`Failed to connect MCP server ${server.name}: ${error.message}`);
      }
    }
  }

  async findAll(): Promise<McpServer[]> {
    return this.mcpServerRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<McpServer | null> {
    return this.mcpServerRepo.findOne({ where: { id } });
  }

  async create(data: Partial<McpServer>): Promise<McpServer> {
    const server = this.mcpServerRepo.create({
      ...data,
      id: data.id || `mcp-${Date.now()}`,
    });
    return this.mcpServerRepo.save(server);
  }

  async update(id: string, data: Partial<McpServer>): Promise<McpServer | null> {
    const server = await this.mcpServerRepo.findOne({ where: { id } });
    if (!server) return null;

    // 如果 enabled 从 false 变为 true，后台连接服务器
    if (!server.enabled && data.enabled) {
      // 后台连接，不阻塞 API 响应
      this.connectServer({ ...server, ...data } as McpServer ).catch(error => {
        this.logger.error(`Background connect failed for ${id}: ${error.message}`);
      });
    }
    // 如果 enabled 从 true 变为 false，断开服务器
    else if (server.enabled && data.enabled === false) {
      await this.disconnectServer(id);
    }

    await this.mcpServerRepo.update(id, data);
    return this.mcpServerRepo.findOne({ where: { id } });
  }

  async delete(id: string): Promise<boolean> {
    await this.disconnectServer(id);
    const result = await this.mcpServerRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async connectServer(server: McpServer): Promise<void> {
    const config: McpClientConfig = {
      id: server.id,
      name: server.name,
      command: server.command,
      args: server.args,
      env: server.env,
      cwd: server.cwd,
    };

    // 添加超时控制，避免阻塞
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout (10s)')), 10000);
    });

    const connectPromise = this.mcpClient.connect(config);

    try {
      await Promise.race([connectPromise, timeoutPromise]);
      this.logger.log(`MCP server connected: ${server.id}`);
    } catch (error: any) {
      this.logger.error(`Failed to connect MCP server ${server.id}: ${error.message}`);
      throw error;
    }
  }

  async disconnectServer(id: string): Promise<void> {
    try {
      await this.mcpClient.disconnect(id);
    } catch (error: any) {
      this.logger.warn(`Failed to disconnect MCP server ${id}: ${error.message}`);
    }
  }

  async getTools(serverId?: string) {
    if (serverId) {
      const client = this.mcpClient.getClient(serverId);
      if (!client) return [];
      const tools = await this.mcpClient.listTools(serverId);
      const server = await this.mcpServerRepo.findOne({ where: { id: serverId } });
      return tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        serverId,
        serverName: server?.name,
      }));
    }

    const servers = await this.mcpServerRepo.find({ where: { enabled: true } });
    const allTools: any[] = [];
    
    for (const server of servers) {
      try {
        const tools = await this.mcpClient.listTools(server.id);
        for (const tool of tools) {
          allTools.push({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            serverId: server.id,
            serverName: server.name,
          });
        }
      } catch (error: any) {
        this.logger.warn(`Failed to list tools for ${server.name}: ${error.message}`);
      }
    }
    
    return allTools;
  }

  // 获取已启用 MCP 服务器的目录（用于文件访问权限）
  async getEnabledServerDirectories(): Promise<Array<{ path: string; serverName: string }>> {
    const servers = await this.mcpServerRepo.find({ where: { enabled: true } });
    const directories: Array<{ path: string; serverName: string }> = [];

    for (const server of servers) {
      // 从 args 中提取路径（最后一个参数通常是路径）
      if (server.args && server.args.length > 0) {
        const lastArg = server.args[server.args.length - 1];
        // 检查是否是有效的目录路径
        if (lastArg && (lastArg.includes('\\') || lastArg.includes('/'))) {
          directories.push({
            path: lastArg,
            serverName: server.name,
          });
        }
      }
      // 也检查 cwd 配置
      if (server.cwd) {
        const existing = directories.find(d => d.path === server.cwd);
        if (!existing) {
          directories.push({
            path: server.cwd,
            serverName: server.name,
          });
        }
      }
    }

    return directories;
  }

  async callTool(serverId: string, toolName: string, args: Record<string, any>) {
    return this.mcpClient.callTool(serverId, toolName, args);
  }
}
