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
exports.ToolConfirmController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tool_registry_service_1 = require("../tools/tool-registry.service");
let ToolConfirmController = class ToolConfirmController {
    constructor(toolRegistry) {
        this.toolRegistry = toolRegistry;
    }
    getPendingConfirmations() {
        return this.toolRegistry.getPendingConfirmations();
    }
    getPendingConfirmation(id) {
        return this.toolRegistry.getPendingConfirmation(id);
    }
    async approveConfirmation(id) {
        console.log(`[ToolConfirm] approve called with id: ${id}`);
        const call = this.toolRegistry.getPendingConfirmation(id);
        console.log(`[ToolConfirm] pending confirmation: ${JSON.stringify(call)}`);
        if (!call) {
            console.log(`[ToolConfirm] Confirmation not found for id: ${id}`);
            return { success: false, error: 'Confirmation not found' };
        }
        const tool = this.toolRegistry.getTool(call.toolName);
        console.log(`[ToolConfirm] tool found: ${JSON.stringify(tool ? { name: tool.name, level: tool.level } : null)}`);
        if (!tool) {
            console.log(`[ToolConfirm] Tool not found: ${call.toolName}`);
            return { success: false, error: 'Tool not found' };
        }
        let result;
        try {
            const content = await tool.handler(call.arguments);
            result = { success: true, content };
        }
        catch (error) {
            result = { success: false, error: error.message };
        }
        this.toolRegistry.deletePendingConfirmation(id);
        this.toolRegistry.setApprovalResult(id, result);
        return result;
    }
    rejectConfirmation(id) {
        this.toolRegistry.rejectApproval(id);
        return { success: true };
    }
};
exports.ToolConfirmController = ToolConfirmController;
__decorate([
    (0, common_1.Get)('pending'),
    (0, swagger_1.ApiOperation)({ summary: '获取待确认操作列表' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], ToolConfirmController.prototype, "getPendingConfirmations", null);
__decorate([
    (0, common_1.Get)('pending/:id'),
    (0, swagger_1.ApiOperation)({ summary: '获取单个待确认操作详情' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], ToolConfirmController.prototype, "getPendingConfirmation", null);
__decorate([
    (0, common_1.Post)('approve/:id'),
    (0, swagger_1.ApiOperation)({ summary: '批准操作' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ToolConfirmController.prototype, "approveConfirmation", null);
__decorate([
    (0, common_1.Post)('reject/:id'),
    (0, swagger_1.ApiOperation)({ summary: '拒绝操作' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ToolConfirmController.prototype, "rejectConfirmation", null);
exports.ToolConfirmController = ToolConfirmController = __decorate([
    (0, swagger_1.ApiTags)('工具确认'),
    (0, common_1.Controller)('tools'),
    __metadata("design:paramtypes", [tool_registry_service_1.ToolRegistry])
], ToolConfirmController);
//# sourceMappingURL=tool-confirm.controller.js.map