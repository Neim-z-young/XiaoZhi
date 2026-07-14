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
exports.WorkspacesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workspace_entity_1 = require("../../entities/workspace.entity");
const fs = require("fs");
const path = require("path");
let WorkspacesService = class WorkspacesService {
    constructor(workspaceRepository) {
        this.workspaceRepository = workspaceRepository;
    }
    async create(userId, createDto) {
        const workspace = new workspace_entity_1.Workspace();
        Object.assign(workspace, { ...createDto, userId });
        return this.workspaceRepository.save(workspace);
    }
    async findAll(userId) {
        return this.workspaceRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id, userId) {
        const workspace = await this.workspaceRepository.findOne({
            where: { id, userId },
        });
        if (!workspace) {
            throw new common_1.NotFoundException('工作区不存在');
        }
        return workspace;
    }
    async update(id, userId, updateDto) {
        const workspace = await this.findOne(id, userId);
        Object.assign(workspace, updateDto);
        return this.workspaceRepository.save(workspace);
    }
    async remove(id, userId) {
        const workspace = await this.findOne(id, userId);
        await this.workspaceRepository.softRemove(workspace);
    }
    async getFileTree(id, userId, relativePath = '/') {
        const workspace = await this.findOne(id, userId);
        const fullPath = path.join(workspace.rootPath, relativePath);
        if (!fs.existsSync(fullPath)) {
            return { path: relativePath, items: [] };
        }
        const items = fs.readdirSync(fullPath, { withFileTypes: true });
        return {
            path: relativePath,
            items: items.map((item) => ({
                name: item.name,
                type: item.isDirectory() ? 'directory' : 'file',
                size: item.isFile() ? fs.statSync(path.join(fullPath, item.name)).size : 0,
            })),
        };
    }
    async search(id, userId, query) {
        console.log(`Searching in workspace ${id} for: ${query}`);
        return [];
    }
};
exports.WorkspacesService = WorkspacesService;
exports.WorkspacesService = WorkspacesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WorkspacesService);
//# sourceMappingURL=workspaces.service.js.map