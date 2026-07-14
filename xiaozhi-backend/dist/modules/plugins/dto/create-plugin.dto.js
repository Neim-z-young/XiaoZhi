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
exports.CreatePluginDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreatePluginDto {
}
exports.CreatePluginDto = CreatePluginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '插件类型', enum: ['mcp', 'a2a', 'builtin'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePluginDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '插件配置' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePluginDto.prototype, "config", void 0);
//# sourceMappingURL=create-plugin.dto.js.map