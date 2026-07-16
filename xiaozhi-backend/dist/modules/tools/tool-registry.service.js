"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ToolRegistry_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = exports.ToolLevel = void 0;
const common_1 = require("@nestjs/common");
var ToolLevel;
(function (ToolLevel) {
    ToolLevel[ToolLevel["L1_SAFE"] = 1] = "L1_SAFE";
    ToolLevel[ToolLevel["L2_LOW_RISK"] = 2] = "L2_LOW_RISK";
    ToolLevel[ToolLevel["L3_MEDIUM_RISK"] = 3] = "L3_MEDIUM_RISK";
    ToolLevel[ToolLevel["L4_HIGH_RISK"] = 4] = "L4_HIGH_RISK";
    ToolLevel[ToolLevel["L5_CRITICAL"] = 5] = "L5_CRITICAL";
})(ToolLevel || (exports.ToolLevel = ToolLevel = {}));
let ToolRegistry = ToolRegistry_1 = class ToolRegistry {
    constructor() {
        this.logger = new common_1.Logger(ToolRegistry_1.name);
        this.tools = new Map();
        this.pendingConfirmations = new Map();
        this.pendingApprovalResolvers = new Map();
        this.approvedResults = new Map();
    }
    register(definition) {
        if (this.tools.has(definition.name)) {
            this.logger.warn(`Tool ${definition.name} is already registered, overwriting`);
        }
        this.tools.set(definition.name, definition);
        this.logger.log(`Registered tool: ${definition.name} (Level ${definition.level})`);
    }
    unregister(name) {
        return this.tools.delete(name);
    }
    getTool(name) {
        return this.tools.get(name);
    }
    listTools() {
        return Array.from(this.tools.values());
    }
    async execute(name, args, userId) {
        const tool = this.tools.get(name);
        if (!tool) {
            return { success: false, error: `Tool not found: ${name}` };
        }
        if (tool.level === ToolLevel.L5_CRITICAL) {
            return { success: false, error: 'This operation is forbidden for security reasons' };
        }
        if (tool.level >= ToolLevel.L3_MEDIUM_RISK) {
            const callId = this.createPendingConfirmation(tool, args, userId);
            return {
                success: false,
                error: `Confirmation required (${callId})`,
            };
        }
        try {
            const result = await tool.handler(args);
            return { success: true, content: result };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    createPendingConfirmation(tool, args, userId) {
        const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const call = {
            id: callId,
            toolName: tool.name,
            arguments: args,
            level: tool.level,
            timestamp: new Date(),
        };
        this.pendingConfirmations.set(callId, call);
        return callId;
    }
    getPendingConfirmation(callId) {
        return this.pendingConfirmations.get(callId);
    }
    getPendingConfirmations(userId) {
        return Array.from(this.pendingConfirmations.values()).filter(c => c.level >= ToolLevel.L3_MEDIUM_RISK);
    }
    async approveConfirmation(callId) {
        const call = this.pendingConfirmations.get(callId);
        if (!call) {
            return { success: false, error: 'Confirmation not found' };
        }
        const existingResult = this.approvedResults.get(callId);
        if (existingResult) {
            this.approvedResults.delete(callId);
            this.pendingConfirmations.delete(callId);
            return existingResult;
        }
        return new Promise((resolve) => {
            this.pendingApprovalResolvers.set(callId, (result) => {
                resolve(result);
                this.pendingApprovalResolvers.delete(callId);
            });
            this.logger.log(`Waiting for external approval: ${callId}`);
        });
    }
    setApprovalResult(callId, result) {
        console.log(`[ToolRegistry] setApprovalResult called: ${callId}, result: ${JSON.stringify(result)}`);
        console.log(`[ToolRegistry] pendingApprovalResolvers keys: ${Array.from(this.pendingApprovalResolvers.keys()).join(', ')}`);
        const resolve = this.pendingApprovalResolvers.get(callId);
        if (resolve) {
            console.log(`[ToolRegistry] Resolving promise for: ${callId}`);
            resolve(result);
            this.pendingApprovalResolvers.delete(callId);
        }
        else {
            console.log(`[ToolRegistry] No pending resolver, storing result for future pickup: ${callId}`);
            this.approvedResults.set(callId, result);
        }
    }
    rejectApproval(callId) {
        const resolve = this.pendingApprovalResolvers.get(callId);
        if (resolve) {
            this.logger.log(`Rejecting approval for: ${callId}`);
            resolve({ success: false, error: 'Rejected by user' });
            this.pendingApprovalResolvers.delete(callId);
        }
        this.pendingConfirmations.delete(callId);
    }
    deletePendingConfirmation(callId) {
        this.pendingConfirmations.delete(callId);
    }
    rejectConfirmation(callId) {
        this.pendingConfirmations.delete(callId);
    }
};
exports.ToolRegistry = ToolRegistry;
exports.ToolRegistry = ToolRegistry = ToolRegistry_1 = __decorate([
    (0, common_1.Injectable)()
], ToolRegistry);
//# sourceMappingURL=tool-registry.service.js.map