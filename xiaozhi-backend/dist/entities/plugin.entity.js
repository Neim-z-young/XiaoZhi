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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Plugin = void 0;
const typeorm_1 = require("typeorm");
const agent_entity_1 = require("./agent.entity");
let Plugin = class Plugin {
};
exports.Plugin = Plugin;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Plugin.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], Plugin.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], Plugin.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Plugin.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Object)
], Plugin.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Plugin.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'installed_at' }),
    __metadata("design:type", Date)
], Plugin.prototype, "installedAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Plugin.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => agent_entity_1.Agent, (agent) => agent.plugins),
    __metadata("design:type", Array)
], Plugin.prototype, "agents", void 0);
exports.Plugin = Plugin = __decorate([
    (0, typeorm_1.Entity)('plugins')
], Plugin);
//# sourceMappingURL=plugin.entity.js.map