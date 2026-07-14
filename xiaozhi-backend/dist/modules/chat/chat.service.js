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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_entity_1 = require("../../entities/session.entity");
const message_entity_1 = require("../../entities/message.entity");
const agent_entity_1 = require("../../entities/agent.entity");
let ChatService = class ChatService {
    constructor(sessionRepository, messageRepository, agentRepository) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.agentRepository = agentRepository;
    }
    async sendMessage(sessionId, userId, content) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new common_1.NotFoundException('会话不存在');
        }
        const userMessage = this.messageRepository.create({
            sessionId,
            role: 'user',
            content,
        });
        await this.messageRepository.save(userMessage);
        await this.sessionRepository.update(sessionId, {
            lastMessageAt: new Date(),
        });
        const assistantMessage = this.messageRepository.create({
            sessionId,
            role: 'assistant',
            content: '这是一个模拟响应，实际需要接入 AI 模型',
            meta: { model: session.agentId ? 'simulated' : 'none' },
        });
        await this.messageRepository.save(assistantMessage);
        return assistantMessage;
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
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __param(1, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(2, (0, typeorm_1.InjectRepository)(agent_entity_1.Agent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ChatService);
//# sourceMappingURL=chat.service.js.map