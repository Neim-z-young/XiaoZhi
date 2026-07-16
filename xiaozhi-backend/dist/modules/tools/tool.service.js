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
var ToolService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs/promises");
const child_process_1 = require("child_process");
const util_1 = require("util");
const tool_registry_service_1 = require("./tool-registry.service");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let ToolService = ToolService_1 = class ToolService {
    constructor(toolRegistry) {
        this.toolRegistry = toolRegistry;
        this.logger = new common_1.Logger(ToolService_1.name);
        this.registerBuiltInTools();
    }
    registerBuiltInTools() {
        this.toolRegistry.register({
            name: 'file_read',
            description: '读取文件内容',
            inputSchema: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: '文件路径' },
                },
                required: ['path'],
            },
            level: tool_registry_service_1.ToolLevel.L1_SAFE,
            handler: async ({ path: filePath }) => {
                const content = await fs.readFile(filePath, 'utf-8');
                return content;
            },
        });
        this.toolRegistry.register({
            name: 'directory_list',
            description: '列出目录内容',
            inputSchema: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: '目录路径' },
                },
                required: ['path'],
            },
            level: tool_registry_service_1.ToolLevel.L1_SAFE,
            handler: async ({ path: dirPath }) => {
                const entries = await fs.readdir(dirPath, { withFileTypes: true });
                return JSON.stringify(entries.map(e => ({
                    name: e.name,
                    type: e.isDirectory() ? 'directory' : 'file',
                })));
            },
        });
        this.toolRegistry.register({
            name: 'file_search',
            description: '搜索文件',
            inputSchema: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: '搜索目录' },
                    pattern: { type: 'string', description: '搜索模式' },
                },
                required: ['path', 'pattern'],
            },
            level: tool_registry_service_1.ToolLevel.L1_SAFE,
            handler: async ({ path: searchPath, pattern }) => {
                const entries = await fs.readdir(searchPath, { withFileTypes: true });
                const matches = entries
                    .filter(e => e.name.includes(pattern))
                    .map(e => ({ name: e.name, type: e.isDirectory() ? 'directory' : 'file' }));
                return JSON.stringify(matches);
            },
        });
        this.toolRegistry.register({
            name: 'file_write',
            description: '写入文件内容',
            inputSchema: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: '文件路径' },
                    content: { type: 'string', description: '文件内容' },
                },
                required: ['path', 'content'],
            },
            level: tool_registry_service_1.ToolLevel.L3_MEDIUM_RISK,
            requiresConfirm: true,
            handler: async ({ path: filePath, content }) => {
                await fs.writeFile(filePath, content, 'utf-8');
                return `File written: ${filePath}`;
            },
        });
        this.toolRegistry.register({
            name: 'command_execute',
            description: '执行Shell命令',
            inputSchema: {
                type: 'object',
                properties: {
                    command: { type: 'string', description: '要执行的命令' },
                    cwd: { type: 'string', description: '工作目录' },
                },
                required: ['command'],
            },
            level: tool_registry_service_1.ToolLevel.L4_HIGH_RISK,
            requiresConfirm: true,
            handler: ({ command, cwd }) => {
                return new Promise((resolve) => {
                    const isWindows = process.platform === 'win32';
                    const shell = isWindows ? 'powershell.exe' : '/bin/bash';
                    const shellArgs = isWindows ? ['-Command', command] : ['-c', command];
                    const child = (0, child_process_1.spawn)(shell, shellArgs, {
                        cwd: cwd || process.cwd(),
                        detached: true,
                        stdio: 'ignore'
                    });
                    child.unref();
                    resolve(`进程已启动，PID: ${child.pid}`);
                });
            },
        });
        this.logger.log('Built-in tools registered');
    }
};
exports.ToolService = ToolService;
exports.ToolService = ToolService = ToolService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tool_registry_service_1.ToolRegistry])
], ToolService);
//# sourceMappingURL=tool.service.js.map