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
exports.AgentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const agent_entity_1 = require("../../entities/agent.entity");
let AgentsService = class AgentsService {
    constructor(agentRepository) {
        this.agentRepository = agentRepository;
    }
    async create(userId, createAgentDto) {
        const agent = new agent_entity_1.Agent();
        Object.assign(agent, { ...createAgentDto, userId });
        return this.agentRepository.save(agent);
    }
    async findAll(userId, page = 1, pageSize = 20, keyword) {
        const query = this.agentRepository.createQueryBuilder('agent')
            .where('agent.user_id = :userId', { userId })
            .andWhere('agent.deleted_at IS NULL');
        if (keyword) {
            query.andWhere('(agent.name ILIKE :keyword OR agent.description ILIKE :keyword)', {
                keyword: `%${keyword}%`,
            });
        }
        const [list, total] = await query
            .orderBy('agent.created_at', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return { list, total };
    }
    async findOne(id, userId) {
        const agent = await this.agentRepository.findOne({
            where: { id, userId },
            relations: ['plugins'],
        });
        if (!agent) {
            throw new common_1.NotFoundException('智能体不存在');
        }
        return agent;
    }
    async update(id, userId, updateAgentDto) {
        const agent = await this.findOne(id, userId);
        Object.assign(agent, updateAgentDto);
        return this.agentRepository.save(agent);
    }
    async remove(id, userId) {
        const agent = await this.findOne(id, userId);
        await this.agentRepository.softRemove(agent);
    }
};
exports.AgentsService = AgentsService;
exports.AgentsService = AgentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(agent_entity_1.Agent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AgentsService);
//# sourceMappingURL=agents.service.js.map