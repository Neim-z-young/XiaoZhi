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
var AgentExecutor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentExecutor = void 0;
const common_1 = require("@nestjs/common");
const tool_registry_service_1 = require("../tools/tool-registry.service");
const ai_gateway_service_1 = require("../ai/ai-gateway.service");
const SYSTEM_PROMPT = `你是一个智能助手，可以调用工具来完成任务。

可用工具：
1. file_read(path): 读取文件，需要提供完整文件路径
2. directory_list(path): 列出目录内容
3. file_search(path, pattern): 搜索文件，path是目录，pattern是文件名模式（如*.ts）
4. file_write(path, content): 写入文件
5. command_execute(command): 执行命令（Windows系统注意使用PowerShell命令）

重要规则：
- 所有工具参数必须完整提供，path必须存在
- file_search 需要提供 path 参数（要搜索的目录）和 pattern 参数
- 执行命令失败后，你应该检查错误原因并尝试正确的命令
- 你会收到工具执行结果，格式为：[OBSERVATION] 结果内容
- 如果不需要调用工具，直接用中文回复用户问题

响应格式：
如果需要调用工具，回复格式为（必须严格按此格式）：
[ACTION] tool_name {"param1": "value1", "param2": "value2"}

如果直接回复，格式为：
[REPLY] 你的回复内容`;
let AgentExecutor = AgentExecutor_1 = class AgentExecutor {
    constructor(toolRegistry, aiGateway) {
        this.toolRegistry = toolRegistry;
        this.aiGateway = aiGateway;
        this.logger = new common_1.Logger(AgentExecutor_1.name);
    }
    async *execute(userMessage, config, context) {
        const maxIterations = config.maxIterations || 10;
        let messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...context.messages,
            { role: 'user', content: userMessage },
        ];
        this.logger.log(`AgentExecutor started with model: ${config.model}`);
        for (let i = 0; i < maxIterations; i++) {
            this.logger.log(`Iteration ${i + 1}: Starting think()`);
            const thought = await this.think(messages, config.model);
            this.logger.log(`Iteration ${i + 1}: thought = "${thought.substring(0, 100)}..."`);
            const action = this.parseAction(thought);
            this.logger.log(`Iteration ${i + 1}: action = ${JSON.stringify(action)}`);
            if (!action) {
                this.logger.log(`Iteration ${i + 1}: No action, sending done event`);
                const reply = this.extractReply(thought);
                const doneEvent = { type: 'done', content: reply || thought };
                context.onEvent(doneEvent);
                yield doneEvent;
                break;
            }
            yield { type: 'thought', content: thought };
            context.onEvent({ type: 'thought', content: thought });
            const tool = this.toolRegistry.getTool(action.name);
            if (!tool) {
                const errorEvent = { type: 'error', content: `Tool not found: ${action.name}` };
                context.onEvent(errorEvent);
                yield errorEvent;
                break;
            }
            if (tool.level === tool_registry_service_1.ToolLevel.L5_CRITICAL) {
                const errorEvent = { type: 'error', content: 'This operation is forbidden for security reasons' };
                context.onEvent(errorEvent);
                yield errorEvent;
                break;
            }
            if (tool.level >= tool_registry_service_1.ToolLevel.L3_MEDIUM_RISK) {
                const confirmId = this.toolRegistry.createPendingConfirmation(tool, action.args);
                const confirmEvent = { type: 'confirm_request', confirmId, tool: action.name, requiresConfirm: true, details: action.args };
                context.onEvent(confirmEvent);
                yield confirmEvent;
                const result = await this.toolRegistry.approveConfirmation(confirmId);
                const obsContent = result.success ? (result.content || 'Done') : (result.error || 'Error');
                const actionEvent = { type: 'action', content: `Executing ${action.name}...`, tool: action.name };
                const obsEvent = { type: 'observation', content: obsContent };
                context.onEvent(actionEvent);
                context.onEvent(obsEvent);
                yield actionEvent;
                yield obsEvent;
                messages.push({ role: 'assistant', content: thought });
                messages.push({ role: 'user', content: `[OBSERVATION] ${obsContent}` });
            }
            else {
                const actionEvent = { type: 'action', content: `Executing ${action.name}...`, tool: action.name };
                context.onEvent(actionEvent);
                yield actionEvent;
                const result = await this.toolRegistry.execute(action.name, action.args);
                if (result.success) {
                    const obsContent = result.content || 'Done';
                    const obsEvent = { type: 'observation', content: obsContent };
                    context.onEvent(obsEvent);
                    yield obsEvent;
                    messages.push({ role: 'assistant', content: thought });
                    messages.push({ role: 'user', content: `[OBSERVATION] ${obsContent}` });
                }
                else {
                    const errorContent = result.error || 'Error';
                    const errorEvent = { type: 'error', content: errorContent };
                    context.onEvent(errorEvent);
                    yield errorEvent;
                    messages.push({ role: 'assistant', content: thought });
                    messages.push({ role: 'user', content: `[OBSERVATION] ${errorContent}` });
                }
            }
        }
        this.logger.log('AgentExecutor finished');
    }
    async think(messages, model) {
        this.logger.log(`think() called with model: ${model}, message count: ${messages.length}`);
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('AI request timeout (60s)')), 60000);
            });
            const response = await Promise.race([
                this.aiGateway.complete({
                    model,
                    messages: messages.map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    temperature: 0.7,
                }),
                timeoutPromise,
            ]);
            this.logger.log(`think() AI response: ${JSON.stringify(response)}`);
            const content = typeof response === 'string' ? response : (response.content || '');
            this.logger.log(`think() extracted content: ${content.substring(0, 200)}`);
            return content;
        }
        catch (error) {
            this.logger.error(`think() AI error: ${error.message}`);
            return `Error: ${error.message}`;
        }
    }
    parseAction(thought) {
        const actionMatch = thought.match(/\[ACTION\]\s*(\w+)\s*(\{.*\})/);
        if (actionMatch) {
            try {
                return {
                    name: actionMatch[1],
                    args: JSON.parse(actionMatch[2]),
                };
            }
            catch {
            }
        }
        const replyMatch = thought.match(/\[REPLY\]\s*(.*)/);
        if (replyMatch) {
            return null;
        }
        return null;
    }
    extractReply(thought) {
        const replyMatch = thought.match(/\[REPLY\]\s*(.*)/);
        if (replyMatch) {
            return replyMatch[1].trim();
        }
        if (!thought.includes('[ACTION]')) {
            return thought.trim();
        }
        return null;
    }
};
exports.AgentExecutor = AgentExecutor;
exports.AgentExecutor = AgentExecutor = AgentExecutor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tool_registry_service_1.ToolRegistry,
        ai_gateway_service_1.AIGatewayService])
], AgentExecutor);
//# sourceMappingURL=agent-executor.service.js.map