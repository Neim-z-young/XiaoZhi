import { Repository } from 'typeorm';
import { Plugin } from '../../entities/plugin.entity';
export declare class PluginsService {
    private readonly pluginRepository;
    constructor(pluginRepository: Repository<Plugin>);
    create(createPluginDto: any): Promise<Plugin>;
    findAll(type?: string, enabled?: boolean): Promise<Plugin[]>;
    findOne(id: string): Promise<Plugin>;
    update(id: string, updatePluginDto: any): Promise<Plugin>;
    remove(id: string): Promise<void>;
    install(type: 'mcp' | 'a2a' | 'builtin', config: Record<string, any>): Promise<Plugin>;
    getTools(pluginId: string): Promise<any[]>;
}
