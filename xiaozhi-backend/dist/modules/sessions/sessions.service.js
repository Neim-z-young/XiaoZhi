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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_entity_1 = require("../../entities/session.entity");
const message_entity_1 = require("../../entities/message.entity");
let SessionsService = class SessionsService {
    constructor(sessionRepository, messageRepository) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
    }
    async create(userId, createSessionDto) {
        const session = new session_entity_1.Session();
        Object.assign(session, { ...createSessionDto, userId });
        return this.sessionRepository.save(session);
    }
    async findAll(userId, page = 1, pageSize = 20, agentId) {
        const query = this.sessionRepository.createQueryBuilder('session')
            .where('session.user_id = :userId', { userId })
            .andWhere('session.deleted_at IS NULL');
        if (agentId) {
            query.andWhere('session.agent_id = :agentId', { agentId });
        }
        const [list, total] = await query
            .orderBy('session.last_message_at', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return { list, total };
    }
    async findOne(id, userId) {
        const session = await this.sessionRepository.findOne({
            where: { id, userId },
            relations: ['messages'],
        });
        if (!session) {
            throw new common_1.NotFoundException('会话不存在');
        }
        return session;
    }
    async update(id, userId, updateSessionDto) {
        const session = await this.findOne(id, userId);
        Object.assign(session, updateSessionDto);
        return this.sessionRepository.save(session);
    }
    async remove(id, userId) {
        const session = await this.findOne(id, userId);
        await this.sessionRepository.softRemove(session);
    }
    async getMessages(sessionId, userId, before, limit = 50) {
        await this.findOne(sessionId, userId);
        const query = this.messageRepository.createQueryBuilder('message')
            .where('message.session_id = :sessionId', { sessionId })
            .orderBy('message.created_at', 'DESC')
            .take(limit);
        if (before) {
            query.andWhere('message.id < :before', { before });
        }
        return query.getMany();
    }
    async updateLastMessageTime(sessionId) {
        await this.sessionRepository.update(sessionId, {
            lastMessageAt: new Date(),
        });
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __param(1, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map