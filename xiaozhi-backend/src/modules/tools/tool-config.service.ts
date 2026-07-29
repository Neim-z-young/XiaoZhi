import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tool } from '../../entities/tool.entity';

@Injectable()
export class ToolConfigService {
  private readonly logger = new Logger(ToolConfigService.name);

  // 缓存已启用的工具名称
  private enabledToolNames: Set<string> = new Set();

  constructor(
    @InjectRepository(Tool)
    private toolRepo: Repository<Tool>,
  ) {}

  async onModuleInit() {
    // 初始化时加载已启用的工具
    await this.refreshEnabledTools();
  }

  // 刷新已启用的工具列表
  async refreshEnabledTools(): Promise<void> {
    const tools = await this.toolRepo.find({ where: { enabled: true } });
    this.enabledToolNames = new Set(tools.map(t => t.name));
    this.logger.log(`Enabled tools: ${[...this.enabledToolNames].join(', ') || 'none'}`);
  }

  // 检查工具是否启用
  isToolEnabled(toolName: string): boolean {
    return this.enabledToolNames.has(toolName);
  }

  // 获取已启用的工具名称列表
  getEnabledToolNames(): string[] {
    return [...this.enabledToolNames];
  }

  // 获取所有工具
  async findAll(): Promise<Tool[]> {
    return this.toolRepo.find({ order: { name: 'ASC' } });
  }

  // 获取已启用的工具
  async findEnabled(): Promise<Tool[]> {
    return this.toolRepo.find({ where: { enabled: true }, order: { name: 'ASC' } });
  }

  // 启用工具
  async enable(id: string): Promise<Tool | null> {
    await this.toolRepo.update(id, { enabled: true });
    await this.refreshEnabledTools();
    return this.toolRepo.findOne({ where: { id } });
  }

  // 禁用工具
  async disable(id: string): Promise<Tool | null> {
    await this.toolRepo.update(id, { enabled: false });
    await this.refreshEnabledTools();
    return this.toolRepo.findOne({ where: { id } });
  }

  // 创建或更新工具配置
  async upsert(name: string, description?: string): Promise<Tool> {
    let tool = await this.toolRepo.findOne({ where: { name } });
    if (tool) {
      if (description) {
        await this.toolRepo.update(tool.id, { description });
      }
      return this.toolRepo.findOne({ where: { name } }) as Promise<Tool>;
    }
    tool = this.toolRepo.create({ name, description, enabled: true, level: 1 });
    return this.toolRepo.save(tool);
  }

  // 批量初始化内置工具
  async initBuiltinTools(): Promise<void> {
    const builtinTools = [
      { name: 'file_read', description: '读取文件内容', level: 1 },
      { name: 'directory_list', description: '列出目录内容', level: 1 },
      { name: 'file_search', description: '搜索文件', level: 1 },
      { name: 'file_write', description: '写入文件', level: 2 },
      { name: 'command_execute', description: '执行命令', level: 3 },
    ];

    for (const tool of builtinTools) {
      await this.upsert(tool.name, tool.description);
      // 更新等级
      const existing = await this.toolRepo.findOne({ where: { name: tool.name } });
      if (existing) {
        await this.toolRepo.update(existing.id, { level: tool.level });
      }
    }

    await this.refreshEnabledTools();
  }
}
