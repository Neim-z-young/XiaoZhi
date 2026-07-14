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
var AIGatewayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIGatewayService = void 0;
const common_1 = require("@nestjs/common");
const model_config_service_1 = require("../../config/model-config.service");
const openai_adapter_1 = require("./adapters/openai.adapter");
const claude_adapter_1 = require("./adapters/claude.adapter");
let AIGatewayService = AIGatewayService_1 = class AIGatewayService {
    constructor(modelConfigService) {
        this.modelConfigService = modelConfigService;
        this.logger = new common_1.Logger(AIGatewayService_1.name);
        this.adapters = new Map();
        this.initializeAdapters();
    }
    initializeAdapters() {
        const models = this.modelConfigService.getAllModels();
        for (const model of models) {
            if (!model.apiKey) {
                this.logger.warn(`Model ${model.id} has no API key, skipping`);
                continue;
            }
            let adapter;
            if (model.provider === 'openai') {
                adapter = new openai_adapter_1.OpenAIAdapter(model);
            }
            else if (model.provider === 'anthropic') {
                adapter = new claude_adapter_1.ClaudeAdapter(model);
            }
            else {
                this.logger.warn(`Unsupported provider for model ${model.id}: ${model.provider}`);
                continue;
            }
            this.adapters.set(model.id, adapter);
            this.logger.log(`Initialized adapter for ${model.id}`);
        }
        this.logger.log(`AIGatewayService initialized with ${this.adapters.size} adapters`);
    }
    async complete(request) {
        const adapter = this.adapters.get(request.model);
        if (!adapter) {
            throw new Error(`No adapter available for model: ${request.model}`);
        }
        return adapter.complete(request);
    }
    async *stream(request) {
        const adapter = this.adapters.get(request.model);
        if (!adapter) {
            throw new Error(`No adapter available for model: ${request.model}`);
        }
        yield* adapter.stream(request);
    }
    getSupportedModels() {
        return Array.from(this.adapters.keys());
    }
    getModelConfigs() {
        return this.modelConfigService.getAllModels().map(m => ({
            id: m.id,
            name: m.name,
            provider: m.provider,
            maxTokens: m.maxTokens,
            temperature: m.temperature,
            enabled: m.enabled,
        }));
    }
    isModelAvailable(modelId) {
        return this.adapters.has(modelId);
    }
};
exports.AIGatewayService = AIGatewayService;
exports.AIGatewayService = AIGatewayService = AIGatewayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [model_config_service_1.ModelConfigService])
], AIGatewayService);
//# sourceMappingURL=ai-gateway.service.js.map