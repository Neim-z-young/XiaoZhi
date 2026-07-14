import { PluginsService } from './plugins.service';
import { CreatePluginDto } from './dto/create-plugin.dto';
export declare class PluginsController {
    private readonly pluginsService;
    constructor(pluginsService: PluginsService);
    install(createPluginDto: CreatePluginDto): Promise<import("../../entities/plugin.entity").Plugin>;
    findAll(type?: string, enabled?: boolean): Promise<import("../../entities/plugin.entity").Plugin[]>;
    findOne(id: string): Promise<import("../../entities/plugin.entity").Plugin>;
    update(id: string, updatePluginDto: any): Promise<import("../../entities/plugin.entity").Plugin>;
    remove(id: string): Promise<void>;
    getTools(id: string): Promise<any[]>;
}
