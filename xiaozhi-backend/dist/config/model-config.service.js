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
var ModelConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelConfigService = void 0;
const common_1 = require("@nestjs/common");
const configuration_1 = require("./configuration");
let ModelConfigService = ModelConfigService_1 = class ModelConfigService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ModelConfigService_1.name);
        this.modelConfigs = new Map();
        this.loadModelConfigs();
    }
    loadModelConfigs() {
        const modelsConfig = this.configService.get('models');
        if (!modelsConfig) {
            this.logger.warn('No models config found, using defaults');
            return;
        }
        this.defaultModelId = modelsConfig.default || 'gpt-4o-mini';
        const enabledModels = modelsConfig.enabled || [];
        for (const model of enabledModels) {
            if (model.enabled) {
                if (model.apiKeyEnv && !model.apiKey) {
                    model.apiKey = process.env[model.apiKeyEnv];
                }
                this.modelConfigs.set(model.id, model);
                this.logger.log(`Loaded model: ${model.id} (${model.provider})`);
            }
        }
        this.logger.log(`ModelConfigService initialized with ${this.modelConfigs.size} models`);
    }
    getModel(id) {
        return this.modelConfigs.get(id);
    }
    getDefaultModel() {
        return this.modelConfigs.get(this.defaultModelId);
    }
    getAllModels() {
        return Array.from(this.modelConfigs.values());
    }
    getEnabledModels() {
        return this.getAllModels().filter(m => m.enabled);
    }
    addModel(config) {
        this.modelConfigs.set(config.id, config);
        this.logger.log(`Added model: ${config.id}`);
    }
    updateModel(id, updates) {
        const existing = this.modelConfigs.get(id);
        if (existing) {
            const updated = { ...existing, ...updates };
            this.modelConfigs.set(id, updated);
            this.logger.log(`Updated model: ${id}`);
        }
    }
    removeModel(id) {
        this.modelConfigs.delete(id);
        this.logger.log(`Removed model: ${id}`);
    }
    isModelEnabled(id) {
        const model = this.modelConfigs.get(id);
        return model?.enabled ?? false;
    }
};
exports.ModelConfigService = ModelConfigService;
exports.ModelConfigService = ModelConfigService = ModelConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [configuration_1.ConfigService])
], ModelConfigService);
//# sourceMappingURL=model-config.service.js.map