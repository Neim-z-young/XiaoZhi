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
exports.PluginsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const plugins_service_1 = require("./plugins.service");
const create_plugin_dto_1 = require("./dto/create-plugin.dto");
let PluginsController = class PluginsController {
    constructor(pluginsService) {
        this.pluginsService = pluginsService;
    }
    install(createPluginDto) {
        return this.pluginsService.install(createPluginDto.type, createPluginDto.config);
    }
    findAll(type, enabled) {
        return this.pluginsService.findAll(type, enabled);
    }
    findOne(id) {
        return this.pluginsService.findOne(id);
    }
    update(id, updatePluginDto) {
        return this.pluginsService.update(id, updatePluginDto);
    }
    remove(id) {
        return this.pluginsService.remove(id);
    }
    getTools(id) {
        return this.pluginsService.getTools(id);
    }
};
exports.PluginsController = PluginsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '安装插件' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_plugin_dto_1.CreatePluginDto]),
    __metadata("design:returntype", void 0)
], PluginsController.prototype, "install", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取插件列表' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'enabled', required: false, type: Boolean }),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('enabled')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", void 0)
], PluginsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取插件详情' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PluginsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新插件' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PluginsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '卸载插件' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PluginsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/tools'),
    (0, swagger_1.ApiOperation)({ summary: '获取插件工具列表' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PluginsController.prototype, "getTools", null);
exports.PluginsController = PluginsController = __decorate([
    (0, swagger_1.ApiTags)('插件管理'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('plugins'),
    __metadata("design:paramtypes", [plugins_service_1.PluginsService])
], PluginsController);
//# sourceMappingURL=plugins.controller.js.map