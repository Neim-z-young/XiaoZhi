"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolsModule = void 0;
const common_1 = require("@nestjs/common");
const tool_registry_service_1 = require("./tool-registry.service");
const tool_service_1 = require("./tool.service");
const tool_confirm_controller_1 = require("./tool-confirm.controller");
let ToolsModule = class ToolsModule {
};
exports.ToolsModule = ToolsModule;
exports.ToolsModule = ToolsModule = __decorate([
    (0, common_1.Module)({
        controllers: [tool_confirm_controller_1.ToolConfirmController],
        providers: [tool_registry_service_1.ToolRegistry, tool_service_1.ToolService],
        exports: [tool_registry_service_1.ToolRegistry, tool_service_1.ToolService],
    })
], ToolsModule);
//# sourceMappingURL=tools.module.js.map