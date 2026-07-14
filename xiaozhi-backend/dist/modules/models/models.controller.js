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
exports.ModelsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const model_config_service_1 = require("../../config/model-config.service");
let ModelsController = class ModelsController {
    constructor(modelConfigService) {
        this.modelConfigService = modelConfigService;
    }
    getAllModels() {
        return {
            models: this.modelConfigService.getAllModels().map(m => ({
                id: m.id,
                name: m.name,
                provider: m.provider,
                maxTokens: m.maxTokens,
                temperature: m.temperature,
                enabled: m.enabled,
                hasApiKey: !!m.apiKey,
            })),
        };
    }
    getEnabledModels() {
        return {
            models: this.modelConfigService.getEnabledModels().map(m => ({
                id: m.id,
                name: m.name,
                provider: m.provider,
                maxTokens: m.maxTokens,
                temperature: m.temperature,
            })),
        };
    }
    getModel(id) {
        const model = this.modelConfigService.getModel(id);
        if (!model) {
            return { error: 'Model not found' };
        }
        return {
            id: model.id,
            name: model.name,
            provider: model.provider,
            baseURL: model.baseURL,
            maxTokens: model.maxTokens,
            temperature: model.temperature,
            enabled: model.enabled,
            hasApiKey: !!model.apiKey,
        };
    }
    addModel(body) {
        if (!body.apiKeyEnv && !body.apiKey) {
            return { error: 'Either apiKey or apiKeyEnv must be provided' };
        }
        if (body.apiKeyEnv && !body.apiKey) {
            body.apiKey = process.env[body.apiKeyEnv];
        }
        this.modelConfigService.addModel(body);
        return { success: true, model: body };
    }
    updateModel(id, updates) {
        if (updates.apiKeyEnv && !updates.apiKey) {
            updates.apiKey = process.env[updates.apiKeyEnv];
        }
        this.modelConfigService.updateModel(id, updates);
        return { success: true };
    }
    deleteModel(id) {
        this.modelConfigService.removeModel(id);
        return { success: true };
    }
    enableModel(id) {
        this.modelConfigService.updateModel(id, { enabled: true });
        return { success: true };
    }
    disableModel(id) {
        this.modelConfigService.updateModel(id, { enabled: false });
        return { success: true };
    }
};
exports.ModelsController = ModelsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取所有模型列表' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ModelsController.prototype, "getAllModels", null);
__decorate([
    (0, common_1.Get)('enabled'),
    (0, swagger_1.ApiOperation)({ summary: '获取已启用的模型列表' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ModelsController.prototype, "getEnabledModels", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取模型详情' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ModelsController.prototype, "getModel", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '添加新模型' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ModelsController.prototype, "addModel", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新模型配置' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ModelsController.prototype, "updateModel", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除模型' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ModelsController.prototype, "deleteModel", null);
__decorate([
    (0, common_1.Post)(':id/enable'),
    (0, swagger_1.ApiOperation)({ summary: '启用模型' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ModelsController.prototype, "enableModel", null);
__decorate([
    (0, common_1.Post)(':id/disable'),
    (0, swagger_1.ApiOperation)({ summary: '禁用模型' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ModelsController.prototype, "disableModel", null);
exports.ModelsController = ModelsController = __decorate([
    (0, swagger_1.ApiTags)('模型管理'),
    (0, common_1.Controller)('models'),
    __metadata("design:paramtypes", [model_config_service_1.ModelConfigService])
], ModelsController);
//# sourceMappingURL=models.controller.js.map