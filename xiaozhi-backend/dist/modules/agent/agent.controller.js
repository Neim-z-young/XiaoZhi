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
var AgentController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const agent_executor_service_1 = require("./agent-executor.service");
let AgentController = AgentController_1 = class AgentController {
    constructor(agentExecutor) {
        this.agentExecutor = agentExecutor;
        this.logger = new common_1.Logger(AgentController_1.name);
    }
    async streamChat(message, model, sessionId, res) {
        this.logger.log(`streamChat called: message="${message}", model="${model}"`);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        const sendSSE = (data) => {
            this.logger.log(`SSE send: ${JSON.stringify(data)}`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };
        try {
            const generator = this.agentExecutor.execute(message, {
                model: model || 'gpt-4o-mini',
                maxIterations: 10,
            }, {
                onEvent: sendSSE,
                messages: [],
            });
            for await (const event of generator) {
                if (event.type === 'done' || event.type === 'error') {
                    break;
                }
            }
        }
        catch (error) {
            this.logger.error(`streamChat error: ${error.message}`);
            sendSSE({ type: 'error', content: error.message });
        }
        res.end();
    }
};
exports.AgentController = AgentController;
__decorate([
    (0, common_1.Get)('stream'),
    (0, swagger_1.ApiOperation)({ summary: 'Agent 流式对话' }),
    __param(0, (0, common_1.Query)('message')),
    __param(1, (0, common_1.Query)('model')),
    __param(2, (0, common_1.Query)('sessionId')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "streamChat", null);
exports.AgentController = AgentController = AgentController_1 = __decorate([
    (0, swagger_1.ApiTags)('Agent'),
    (0, common_1.Controller)('agent'),
    __metadata("design:paramtypes", [agent_executor_service_1.AgentExecutor])
], AgentController);
//# sourceMappingURL=agent.controller.js.map