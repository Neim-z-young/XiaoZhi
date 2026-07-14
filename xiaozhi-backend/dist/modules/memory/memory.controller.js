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
exports.MemoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const memory_service_1 = require("./memory.service");
let MemoryController = class MemoryController {
    constructor(memoryService) {
        this.memoryService = memoryService;
    }
    writeShortTerm(body) {
        return this.memoryService.writeShortTerm(body.sessionId, body.content, body.role);
    }
    readShortTerm(sessionId) {
        return this.memoryService.readShortTerm(sessionId);
    }
    writeLongTerm(body) {
        return this.memoryService.writeLongTerm('default-user-id', body.agentId, body.content, body.embedding);
    }
    searchLongTerm(body) {
        return this.memoryService.searchLongTerm('default-user-id', body.agentId, body.query, body.embedding, body.topK);
    }
    consolidate(body) {
        return this.memoryService.consolidate(body.sessionId, body.agentId);
    }
};
exports.MemoryController = MemoryController;
__decorate([
    (0, common_1.Post)('short-term'),
    (0, swagger_1.ApiOperation)({ summary: '写入短时记忆' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MemoryController.prototype, "writeShortTerm", null);
__decorate([
    (0, common_1.Get)('short-term/:sessionId'),
    (0, swagger_1.ApiOperation)({ summary: '读取短时记忆' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MemoryController.prototype, "readShortTerm", null);
__decorate([
    (0, common_1.Post)('long-term'),
    (0, swagger_1.ApiOperation)({ summary: '写入长时记忆' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MemoryController.prototype, "writeLongTerm", null);
__decorate([
    (0, common_1.Post)('long-term/search'),
    (0, swagger_1.ApiOperation)({ summary: '检索长时记忆' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MemoryController.prototype, "searchLongTerm", null);
__decorate([
    (0, common_1.Post)('consolidate'),
    (0, swagger_1.ApiOperation)({ summary: '总结短时记忆写入长时' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MemoryController.prototype, "consolidate", null);
exports.MemoryController = MemoryController = __decorate([
    (0, swagger_1.ApiTags)('记忆系统'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('memory'),
    __metadata("design:paramtypes", [memory_service_1.MemoryService])
], MemoryController);
//# sourceMappingURL=memory.controller.js.map