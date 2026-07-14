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
exports.KnowledgeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const knowledge_base_entity_1 = require("../../entities/knowledge-base.entity");
let KnowledgeService = class KnowledgeService {
    constructor(knowledgeBaseRepository) {
        this.knowledgeBaseRepository = knowledgeBaseRepository;
    }
    async create(userId, createDto) {
        const kb = new knowledge_base_entity_1.KnowledgeBase();
        Object.assign(kb, { ...createDto, userId });
        return this.knowledgeBaseRepository.save(kb);
    }
    async findAll(userId) {
        return this.knowledgeBaseRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id, userId) {
        const kb = await this.knowledgeBaseRepository.findOne({
            where: { id, userId },
        });
        if (!kb) {
            throw new common_1.NotFoundException('知识库不存在');
        }
        return kb;
    }
    async update(id, userId, updateDto) {
        const kb = await this.findOne(id, userId);
        Object.assign(kb, updateDto);
        return this.knowledgeBaseRepository.save(kb);
    }
    async remove(id, userId) {
        const kb = await this.findOne(id, userId);
        await this.knowledgeBaseRepository.softRemove(kb);
    }
    async search(id, userId, query, topK = 5) {
        await this.findOne(id, userId);
        return [
            { documentId: 'doc-1', content: '模拟检索结果：' + query, score: 0.95 },
        ];
    }
};
exports.KnowledgeService = KnowledgeService;
exports.KnowledgeService = KnowledgeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(knowledge_base_entity_1.KnowledgeBase)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], KnowledgeService);
//# sourceMappingURL=knowledge.service.js.map