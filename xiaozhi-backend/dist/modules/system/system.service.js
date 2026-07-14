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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemService = void 0;
const common_1 = require("@nestjs/common");
const configuration_1 = require("../../config/configuration");
let SystemService = class SystemService {
    constructor(configService) {
        this.configService = configService;
    }
    getHealth() {
        return {
            status: 'ok',
            version: '0.1.0',
            timestamp: new Date().toISOString(),
        };
    }
    getModels() {
        const models = this.configService.get('models.list') || [];
        const defaultModel = this.configService.get('models.default') || 'gpt-4o-mini';
        return {
            default: defaultModel,
            list: models,
        };
    }
    getStats() {
        return {
            sessions: 0,
            agents: 0,
            messages: 0,
            plugins: 0,
        };
    }
};
exports.SystemService = SystemService;
exports.SystemService = SystemService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [configuration_1.ConfigService])
], SystemService);
//# sourceMappingURL=system.service.js.map