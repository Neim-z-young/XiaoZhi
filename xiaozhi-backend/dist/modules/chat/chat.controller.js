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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const chat_service_1 = require("./chat.service");
let ChatController = class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async sendMessage(body) {
        return this.chatService.sendMessage(body.sessionId, 'default-user-id', body.message, body.model);
    }
    async streamChat(sessionId, message, model, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        const sendSSE = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };
        try {
            const aiStream = await this.chatService.getAIStream(sessionId, 'default-user-id', message, model);
            for await (const chunk of aiStream) {
                sendSSE({ content: chunk, done: false });
            }
            sendSSE({ content: '', done: true });
        }
        catch (error) {
            console.error('Stream error:', error);
            sendSSE({ content: `错误: ${error.message}`, done: true });
        }
        res.end();
    }
    stopGeneration(sessionId) {
        this.chatService.stopGeneration(sessionId);
        return { success: true };
    }
    feedback(messageId, body) {
        return this.chatService.feedback(messageId, 'default-user-id', body.rating, body.comment);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '发送消息' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)(':sessionId/stream'),
    (0, swagger_1.ApiOperation)({ summary: 'SSE 流式对话' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Query)('message')),
    __param(2, (0, common_1.Query)('model')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "streamChat", null);
__decorate([
    (0, common_1.Post)(':sessionId/stop'),
    (0, swagger_1.ApiOperation)({ summary: '中断生成' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "stopGeneration", null);
__decorate([
    (0, common_1.Post)('messages/:messageId/feedback'),
    (0, swagger_1.ApiOperation)({ summary: '消息反馈' }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "feedback", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('对话'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map