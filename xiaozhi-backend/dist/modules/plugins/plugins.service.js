"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const plugin_entity_1 = require("../../entities/plugin.entity");
let PluginsService = class PluginsService {
    constructor(pluginRepository) {
        this.pluginRepository = pluginRepository;
    }
    async create(createPluginDto) {
        const plugin = new plugin_entity_1.Plugin();
        Object.assign(plugin, createPluginDto);
        return this.pluginRepository.save(plugin);
    }
    async findAll(type, enabled) {
        const query = this.pluginRepository.createQueryBuilder('plugin');
        if (type) {
            query.andWhere('plugin.type = :type', { type });
        }
        if (enabled !== undefined) {
            query.andWhere('plugin.enabled = :enabled', { enabled });
        }
        return query.orderBy('plugin.installed_at', 'DESC').getMany();
    }
    async findOne(id) {
        const plugin = await this.pluginRepository.findOne({ where: { id } });
        if (!plugin) {
            throw new common_1.NotFoundException('插件不存在');
        }
        return plugin;
    }
    async update(id, updatePluginDto) {
        const plugin = await this.findOne(id);
        Object.assign(plugin, updatePluginDto);
        return this.pluginRepository.save(plugin);
    }
    async remove(id) {
        const plugin = await this.findOne(id);
        await this.pluginRepository.remove(plugin);
    }
    async install(type, config) {
        const plugin = this.pluginRepository.create({
            name: config.name || `plugin-${Date.now()}`,
            type,
            config,
            enabled: true,
        });
        return this.pluginRepository.save(plugin);
    }
    async getTools(pluginId) {
        const plugin = await this.findOne(pluginId);
        return plugin.config?.tools || [];
    }
};
exports.PluginsService = PluginsService;
exports.PluginsService = PluginsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(plugin_entity_1.Plugin)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PluginsService);
//# sourceMappingURL=plugins.service.js.map