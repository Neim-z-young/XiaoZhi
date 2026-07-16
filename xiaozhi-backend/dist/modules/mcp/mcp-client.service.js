"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var McpClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpClientService = void 0;
const common_1 = require("@nestjs/common");
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
let McpClientService = McpClientService_1 = class McpClientService {
    constructor() {
        this.logger = new common_1.Logger(McpClientService_1.name);
        this.clients = new Map();
    }
    async connect(config) {
        if (this.clients.has(config.id)) {
            return this.clients.get(config.id);
        }
        const transport = new stdio_js_1.StdioClientTransport({
            command: config.command,
            args: config.args,
            env: config.env,
            cwd: config.cwd,
        });
        const client = new index_js_1.Client({
            name: config.name || 'xiaozhi-mcp-client',
            version: '1.0.0',
        }, { capabilities: { sampling: {}, tools: {} } });
        try {
            await client.connect(transport);
            this.clients.set(config.id, client);
            this.logger.log(`MCP client connected: ${config.id}`);
            return client;
        }
        catch (error) {
            this.logger.error(`Failed to connect MCP client: ${error.message}`);
            throw error;
        }
    }
    async disconnect(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            await client.close();
            this.clients.delete(clientId);
            this.logger.log(`MCP client disconnected: ${clientId}`);
        }
    }
    async listTools(clientId) {
        const client = this.clients.get(clientId);
        if (!client) {
            throw new Error(`MCP client not found: ${clientId}`);
        }
        const response = await client.listTools();
        return response.tools || [];
    }
    async callTool(clientId, toolName, args) {
        const client = this.clients.get(clientId);
        if (!client) {
            throw new Error(`MCP client not found: ${clientId}`);
        }
        try {
            const result = await client.callTool({ name: toolName, arguments: args });
            return {
                success: true,
                content: result.content,
            };
        }
        catch (error) {
            this.logger.error(`Tool call failed: ${error.message}`);
            return {
                success: false,
                content: [],
                error: error.message,
            };
        }
    }
    getClient(clientId) {
        return this.clients.get(clientId);
    }
    getConnectedClients() {
        return Array.from(this.clients.keys());
    }
};
exports.McpClientService = McpClientService;
exports.McpClientService = McpClientService = McpClientService_1 = __decorate([
    (0, common_1.Injectable)()
], McpClientService);
//# sourceMappingURL=mcp-client.service.js.map