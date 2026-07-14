import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plugin } from '../../entities/plugin.entity';

@Injectable()
export class PluginsService {
  constructor(
    @InjectRepository(Plugin)
    private readonly pluginRepository: Repository<Plugin>,
  ) {}

  async create(createPluginDto: any): Promise<Plugin> {
    const plugin = new Plugin();
    Object.assign(plugin, createPluginDto);
    return this.pluginRepository.save(plugin) as Promise<Plugin>;
  }

  async findAll(type?: string, enabled?: boolean): Promise<Plugin[]> {
    const query = this.pluginRepository.createQueryBuilder('plugin');

    if (type) {
      query.andWhere('plugin.type = :type', { type });
    }
    if (enabled !== undefined) {
      query.andWhere('plugin.enabled = :enabled', { enabled });
    }

    return query.orderBy('plugin.installed_at', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Plugin> {
    const plugin = await this.pluginRepository.findOne({ where: { id } });
    if (!plugin) {
      throw new NotFoundException('插件不存在');
    }
    return plugin;
  }

  async update(id: string, updatePluginDto: any): Promise<Plugin> {
    const plugin = await this.findOne(id);
    Object.assign(plugin, updatePluginDto);
    return this.pluginRepository.save(plugin);
  }

  async remove(id: string): Promise<void> {
    const plugin = await this.findOne(id);
    await this.pluginRepository.remove(plugin);
  }

  async install(type: 'mcp' | 'a2a' | 'builtin', config: Record<string, any>): Promise<Plugin> {
    const plugin = this.pluginRepository.create({
      name: config.name || `plugin-${Date.now()}`,
      type,
      config,
      enabled: true,
    });
    return this.pluginRepository.save(plugin);
  }

  async getTools(pluginId: string): Promise<any[]> {
    const plugin = await this.findOne(pluginId);
    // TODO: 根据插件类型获取实际工具列表
    // MCP: 调用 MCP SDK 获取工具
    // A2A: 调用 A2A SDK 获取能力
    // builtin: 直接返回内置工具
    return plugin.config?.tools || [];
  }
}
