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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_entity_1 = require("../../entities/session.entity");
const message_entity_1 = require("../../entities/message.entity");
const agent_entity_1 = require("../../entities/agent.entity");
const ai_gateway_service_1 = require("../ai/ai-gateway.service");
let ChatService = ChatService_1 = class ChatService {
    constructor(sessionRepository, messageRepository, agentRepository, aiGateway) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.agentRepository = agentRepository;
        this.aiGateway = aiGateway;
        this.logger = new common_1.Logger(ChatService_1.name);
        this.abortControllers = new Map();
    }
    async sendMessage(sessionId, userId, content, model) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new common_1.NotFoundException('会话不存在');
        }
        const userMessage = new message_entity_1.Message();
        userMessage.sessionId = sessionId;
        userMessage.role = 'user';
        userMessage.content = content;
        await this.messageRepository.save(userMessage);
        await this.sessionRepository.update(sessionId, {
            lastMessageAt: new Date(),
        });
        const historyMessages = await this.getMessages(sessionId, userId);
        const aiMessages = historyMessages.map(m => ({
            role: m.role,
            content: m.content,
        }));
        aiMessages.push({ role: 'user', content });
        let selectedModel = model || 'gpt-4o-mini';
        if (!model && session.agentId) {
            const agent = await this.agentRepository.findOne({ where: { id: session.agentId } });
            if (agent) {
                selectedModel = agent.modelId || selectedModel;
                if (agent.prompt) {
                    aiMessages.unshift({ role: 'system', content: agent.prompt });
                }
            }
        }
        try {
            const response = await this.aiGateway.complete({
                model: selectedModel,
                messages: aiMessages,
                temperature: 0.7,
            });
            const assistantMessage = new message_entity_1.Message();
            assistantMessage.sessionId = sessionId;
            assistantMessage.role = 'assistant';
            assistantMessage.content = response.content;
            assistantMessage.meta = { model: response.model, usage: response.usage };
            await this.messageRepository.save(assistantMessage);
            return assistantMessage;
        }
        catch (error) {
            this.logger.error(`AI call failed: ${error.message}`);
            const errorMessage = new message_entity_1.Message();
            errorMessage.sessionId = sessionId;
            errorMessage.role = 'assistant';
            errorMessage.content = `抱歉，发生了错误：${error.message}`;
            errorMessage.meta = { error: true };
            await this.messageRepository.save(errorMessage);
            return errorMessage;
        }
    }
    async getAIStream(sessionId, userId, content, model) {
        let session = await this.sessionRepository.findOne({
            where: { id: sessionId, userId },
        });
        if (!session) {
            session = new session_entity_1.Session();
            session.id = sessionId;
            session.userId = userId;
            session.lastMessageAt = new Date();
            session.createdAt = new Date();
            await this.sessionRepository.save(session);
        }
        const userMessage = new message_entity_1.Message();
        userMessage.sessionId = sessionId;
        userMessage.role = 'user';
        userMessage.content = content;
        await this.messageRepository.save(userMessage);
        const historyMessages = await this.getMessages(sessionId, userId);
        const aiMessages = historyMessages.map(m => ({
            role: m.role,
            content: m.content,
        }));
        aiMessages.push({ role: 'user', content });
        let selectedModel = model || 'gpt-4o-mini';
        if (!model && session.agentId) {
            const agent = await this.agentRepository.findOne({ where: { id: session.agentId } });
            if (agent?.modelId) {
                selectedModel = agent.modelId;
            }
        }
        this.logger.log(`getAIStream: received model="${model}", selectedModel="${selectedModel}", session.agentId="${session.agentId}"`);
        const abortController = new AbortController();
        this.abortControllers.set(sessionId, abortController);
        const self = this;
        return (async function* () {
            try {
                for await (const chunk of self.aiGateway.stream({ model: selectedModel, messages: aiMessages })) {
                    if (abortController.signal.aborted) {
                        break;
                    }
                    yield chunk.content;
                }
            }
            finally {
                self.abortControllers.delete(sessionId);
            }
        })();
    }
    stopGeneration(sessionId) {
        const controller = this.abortControllers.get(sessionId);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(sessionId);
        }
    }
    async getMessages(sessionId, userId, before, limit = 50) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new common_1.NotFoundException('会话不存在');
        }
        const query = this.messageRepository.createQueryBuilder('message')
            .where('message.session_id = :sessionId', { sessionId })
            .orderBy('message.created_at', 'DESC')
            .take(limit);
        if (before) {
            query.andWhere('message.id < :before', { before });
        }
        return query.getMany();
    }
    async feedback(messageId, userId, rating, comment) {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['session'],
        });
        if (!message || message.session.userId !== userId) {
            throw new common_1.NotFoundException('消息不存在');
        }
        message.feedback = rating;
        message.feedbackComment = comment ?? null;
        return this.messageRepository.save(message);
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __param(1, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(2, (0, typeorm_1.InjectRepository)(agent_entity_1.Agent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        ai_gateway_service_1.AIGatewayService])
], ChatService);
//# sourceMappingURL=chat.service.js.map