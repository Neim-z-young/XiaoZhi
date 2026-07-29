import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import * as os from 'os';
import * as path from 'path';
import { ToolRegistry, ToolLevel } from '../tools/tool-registry.service';
import { ToolService } from '../tools/tool.service';
import { ToolConfigService } from '../tools/tool-config.service';
import { AIGatewayService } from '../ai/ai-gateway.service';
import { McpServerService } from '../mcp/mcp-server.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { MemoryService } from '../memory/memory.service';
import { ModelConfigService } from '../../config/model-config.service';

export interface ThoughtStep {
  id: string;
  thought: string;
  action?: string;
  observation?: string;
  toolName?: string;
  toolArgs?: Record<string, any>;
  result?: any;
  timestamp: Date;
}

export interface AgentConfig {
  modelId: string;  // 配置中的模型 ID（用于查找配置）
  maxIterations?: number;
  systemPrompt?: string;
  userId?: string;
  agentId?: string;
  sessionId?: string;
  enableMemory?: boolean;
}

export interface AgentStreamEvent {
  type: 'thought' | 'action' | 'observation' | 'confirm_request' | 'done' | 'error';
  content?: string;
  tool?: string;
  requiresConfirm?: boolean;
  confirmId?: string;
  details?: any;
}

const SYSTEM_PROMPT_BASE = `你是一个智能助手，可以调用工具来完成任务。

重要规则：
- 所有工具参数必须使用绝对路径，禁止使用相对路径（如 "."、".."）
- 你会收到工具执行结果，格式为：[OBSERVATION] 结果内容
- 如果工具返回"路径不在允许范围内"，必须使用沙箱目录或工作区的绝对路径重试
- 执行命令失败后，你应该检查错误原因并尝试正确的命令

响应格式：
如果需要调用工具，回复格式为（必须严格按此格式）：
[ACTION] tool_name {"param1": "value1", "param2": "value2"}

如果直接回复，格式为：
[REPLY] 你的回复内容`;

// 内置工具定义
const BUILTIN_TOOLS: Record<string, { description: string }> = {
  'file_read': { description: '读取文件，需要提供完整文件路径' },
  'directory_list': { description: '列出目录内容' },
  'file_search': { description: '搜索文件，path是目录，pattern是文件名模式（如*.ts）' },
  'file_write': { description: '写入文件' },
  'command_execute': { description: '执行命令（Windows系统注意使用PowerShell命令）' },
};

// 动态生成包含 MCP 工具和工作区信息的 system prompt
function buildSystemPrompt(
  mcpTools: Array<{ name: string; description: string; inputSchema: any; serverId: string }>,
  directories: Array<{ path: string; type: string; label: string }> = [],
  enabledBuiltinTools: string[] = [],
  memoryContext?: string,
): string {
  let prompt = SYSTEM_PROMPT_BASE;

  // 添加已启用的内置工具
  if (enabledBuiltinTools.length > 0) {
    prompt += '\n\n内置工具：';
    enabledBuiltinTools.forEach((toolName, index) => {
      const tool = BUILTIN_TOOLS[toolName];
      if (tool) {
        prompt += `\n${index + 1}. ${toolName}(path): ${tool.description}`;
      }
    });
  }

  // 添加允许的目录信息
  if (directories.length > 0) {
    const workspaceDirs = directories.filter(d => d.type === 'workspace');
    const sandboxDirs = directories.filter(d => d.type === 'sandbox');
    const mcpDirs = directories.filter(d => d.type === 'mcp');

    prompt += '\n\n允许访问的目录：';
    if (sandboxDirs.length > 0) {
      prompt += `\n- 沙箱目录: ${sandboxDirs.map(d => d.path).join(', ')}`;
    }
    if (workspaceDirs.length > 0) {
      prompt += `\n- 工作区: ${workspaceDirs.map(d => `${d.label}(${d.path})`).join(', ')}`;
    }
    if (mcpDirs.length > 0) {
      prompt += `\n- MCP 目录: ${mcpDirs.map(d => `${d.label}(${d.path})`).join(', ')}`;
    }
  }

  // 添加 MCP 工具
  if (mcpTools.length > 0) {
    prompt += '\n\nMCP 服务器工具（来自外部 MCP 服务器）：';
    for (const tool of mcpTools) {
      const params = tool.inputSchema?.properties
        ? Object.keys(tool.inputSchema.properties).map(k => `${k}`).join(', ')
        : '（无参数）';
      prompt += `\n- ${tool.name}(${params}): ${tool.description || 'MCP 工具'}`;
    }
    prompt += '\n\n注意：MCP 工具可以直接调用，参数格式与内置工具相同。';
  }

  // 添加记忆上下文
  if (memoryContext) {
    prompt += '\n\n用户历史记忆：\n' + memoryContext;
  }

  return prompt;
}

@Injectable()
export class AgentExecutor implements OnModuleInit {
  private readonly logger = new Logger(AgentExecutor.name);
  private mcpTools: Array<{ name: string; description: string; inputSchema: any; serverId: string }> = [];

  constructor(
    private readonly toolRegistry: ToolRegistry,
    private readonly aiGateway: AIGatewayService,
    private readonly mcpServerService: McpServerService,
    private readonly workspaceService: WorkspaceService,
    private readonly toolConfigService: ToolConfigService,
    @Inject(forwardRef(() => ToolService))
    private readonly toolService: ToolService,
    private readonly memoryService: MemoryService,
    private readonly modelConfigService: ModelConfigService,
  ) {}

  async onModuleInit() {
    // 初始化 MCP 工具和内置工具配置
    await this.refreshMcpTools();
    await this.toolConfigService.initBuiltinTools();
  }

  // 刷新 MCP 工具（每次执行前调用，确保获取最新状态）
  async refreshMcpTools() {
    this.mcpTools = []; // 清空现有工具
    try {
      // getTools() 默认只返回已启用服务器的工具
      const tools = await this.mcpServerService.getTools();
      for (const tool of tools) {
        this.mcpTools.push({
          name: tool.name,
          description: tool.description || `MCP tool: ${tool.name}`,
          inputSchema: tool.inputSchema || { type: 'object', properties: {}, required: [] },
          serverId: tool.serverId,
        });
      }
      this.logger.log(`Total MCP tools loaded from enabled servers: ${this.mcpTools.length}`);

      // 更新 MCP 服务器的目录
      const mcpDirs = await this.mcpServerService.getEnabledServerDirectories();
      this.toolService.updateMcpDirectories(mcpDirs);
    } catch (error: any) {
      this.logger.warn(`Failed to load MCP tools: ${error.message}`);
    }
  }

  private async loadMcpTools() {
    // 为了向后兼容，调用 refreshMcpTools
    await this.refreshMcpTools();
  }

  // 刷新工作区目录并返回所有目录信息
  private async refreshWorkspaceRoots(): Promise<Array<{ path: string; type: string; label: string }>> {
    try {
      const workspaces = await this.workspaceService.findEnabled();
      this.toolService.updateWorkspaceRoots(workspaces);
      this.logger.log(`Workspace roots refreshed: ${workspaces.length} enabled`);
      return this.toolService.getAllDirectories();
    } catch (error: any) {
      this.logger.warn(`Failed to refresh workspace roots: ${error.message}`);
      return this.toolService.getAllDirectories();
    }
  }

  async *execute(
    userMessage: string,
    config: AgentConfig,
    context: {
      onEvent: (event: AgentStreamEvent) => void;
      messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    },
  ): AsyncGenerator<AgentStreamEvent> {
    const maxIterations = config.maxIterations || 10;
    const enableMemory = config.enableMemory !== false; // 默认启用记忆
    const userId = config.userId || 'default-user';
    const agentId = config.agentId || 'default-agent';
    const sessionId = config.sessionId;

    // 刷新 MCP 工具，确保获取最新的启用状态
    await this.refreshMcpTools();

    // 刷新工具配置，确保获取最新的启用/禁用状态
    await this.toolConfigService.refreshEnabledTools();
    const enabledBuiltinTools = await this.toolConfigService.getEnabledToolNames();

    // 刷新工作区目录，确保工具可以访问最新的工作区
    const directories = await this.refreshWorkspaceRoots();

    // 加载短时记忆（会话历史）
    let shortTermMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    if (enableMemory && sessionId) {
      try {
        const shortTermMemories = await this.memoryService.readShortTerm(sessionId, 20);
        this.logger.log(`Found ${shortTermMemories.length} short-term memories for session=${sessionId}`);
        shortTermMessages = shortTermMemories.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
      } catch (error: any) {
        this.logger.warn(`Failed to load short-term memories: ${error.message}`);
      }
    }

    // 加载长时记忆上下文
    let memoryContext: string | undefined;
    this.logger.log(`Loading long-term memories: enableMemory=${enableMemory}, userId=${userId}, agentId=${agentId}`);
    if (enableMemory && userId && agentId) {
      try {
        const memories = await this.memoryService.getLongTermMemories(userId, agentId, 10);
        this.logger.log(`Found ${memories.length} long-term memories in database`);
        if (memories.length > 0) {
          memoryContext = memories
            .map((m, idx) => `[${idx + 1}] ${m.content}`)
            .join('\n');
          this.logger.log(`Memory context prepared, first 200 chars: ${memoryContext.substring(0, 200)}`);
        }
      } catch (error: any) {
        this.logger.warn(`Failed to load long-term memories: ${error.message}`);
      }
    } else {
      this.logger.log(`Skipping long-term memory load: enableMemory=${enableMemory}, userId=${userId}, agentId=${agentId}`);
    }

    let messages = [
      { role: 'system' as const, content: buildSystemPrompt(this.mcpTools, directories, enabledBuiltinTools, memoryContext) },
      ...shortTermMessages,  // 添加会话历史
      ...context.messages,
      { role: 'user' as const, content: userMessage },
    ];

    // 获取模型的 API 名称
    const modelConfig = this.modelConfigService.getModel(config.modelId);
    const apiModelName = modelConfig?.model || config.modelId;
    
    this.logger.log(`AgentExecutor started with modelId: ${config.modelId}, apiModel: ${apiModelName}, memory: ${enableMemory}`);
    this.logger.log(`MCP tools available: ${this.mcpTools.map(t => t.name).join(', ')}`);

    for (let i = 0; i < maxIterations; i++) {
      this.logger.log(`Iteration ${i + 1}: Starting think()`);

      // 使用流式思考，带超时控制
      let thought = '';
      let lastSentLength = 0;
      let chunkCount = 0;
      let streamEnded = false;

      // 设置超时（深度思考模型如 deepseek-reasoner 可能需要更长时间）
      const timeoutMs = 180000; // 3 分钟
      let timeoutHandle: NodeJS.Timeout | undefined;
      
      const timeoutPromise = new Promise<'timeout'>((resolve) => {
        timeoutHandle = setTimeout(() => {
          this.logger.warn(`Iteration ${i + 1}: AI stream timeout after ${timeoutMs / 1000}s`);
          resolve('timeout');
        }, timeoutMs);
      });

      const streamPromise = (async () => {
        try {
          for await (const chunk of this.aiGateway.stream({
            model: apiModelName,
            messages: messages.map(m => ({
              role: m.role as 'user' | 'assistant' | 'system',
              content: m.content,
            })),
            temperature: 0.7,
          })) {
            chunkCount++;
            thought += chunk.content;
            // 只发送新增的部分（保留完整内容，包括思考标签）
            if (thought.length > lastSentLength) {
              const newContent = thought.substring(lastSentLength);
              if (newContent) {
                this.logger.log(`Sending thought event, length=${newContent.length}, content="${newContent.substring(0, 100)}..."`);
                context.onEvent({ type: 'thought', content: newContent });
              }
              lastSentLength = thought.length;
            }
          }
        } catch (error: any) {
          this.logger.error(`Stream error: ${error.message}`);
        }
        streamEnded = true;
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
      })();

      // 等待流完成或超时
      await Promise.race([streamPromise, timeoutPromise]);
      
      // 如果超时但流还没结束，继续等待流完成（不中断）
      if (!streamEnded) {
        this.logger.log(`Iteration ${i + 1}: Waiting for stream to finish...`);
        await streamPromise;
      }
      
      this.logger.log(`Iteration ${i + 1}: Received ${chunkCount} chunks, total length: ${thought.length}`);

      this.logger.log(`Iteration ${i + 1}: thought = "${thought.substring(0, 200)}${thought.length > 200 ? '...' : ''}"`);
      this.logger.log(`Iteration ${i + 1}: thought full content: ${JSON.stringify(thought)}`);
      
      const action = this.parseAction(thought);
      this.logger.log(`Iteration ${i + 1}: action = ${JSON.stringify(action)}`);
      
      if (!action) {
        this.logger.log(`Iteration ${i + 1}: No action, sending done event`);
        const reply = this.extractReply(thought);
        
        // 如果 AI 返回空内容，尝试用之前的 observation
        let finalContent = reply || thought;
        if (!finalContent && messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          if (typeof lastMsg.content === 'string' && lastMsg.content.startsWith('[OBSERVATION]')) {
            finalContent = lastMsg.content.replace('[OBSERVATION]', '').trim();
          }
        }
        
        // 确保 finalContent 是字符串
        if (typeof finalContent !== 'string') {
          finalContent = JSON.stringify(finalContent);
        }
        
        // 保存对话到短时记忆
        if (enableMemory && sessionId && typeof finalContent === 'string' && finalContent.length > 0) {
          try {
            await this.memoryService.writeShortTerm(sessionId, userMessage, 'user');
            await this.memoryService.writeShortTerm(sessionId, finalContent, 'assistant');
            this.logger.log(`Saved conversation to short-term memory: session=${sessionId}`);
          } catch (error: any) {
            this.logger.warn(`Failed to save to short-term memory: ${error.message}`);
          }
        }

        const doneEvent = { type: 'done' as const, content: finalContent };
        context.onEvent(doneEvent);
        yield doneEvent;
        break;
      }

      const tool = this.toolRegistry.getTool(action.name);

      // 检查是否是 MCP 工具
      const mcpTool = this.mcpTools.find(t => t.name === action.name);

      if (mcpTool) {
        // MCP 工具直接执行
        const actionEvent = { type: 'action' as const, content: `Executing MCP tool: ${action.name}...`, tool: action.name };
        context.onEvent(actionEvent);
        yield actionEvent;

        const result = await this.mcpServerService.callTool(mcpTool.serverId, action.name, action.args);
        const obsContent = result.success
          ? (result.content?.[0]?.text || 'Done')
          : (result.error || 'Error');
        const obsEvent = { type: 'observation' as const, content: obsContent };
        context.onEvent(obsEvent);
        yield obsEvent;

        messages.push({ role: 'assistant', content: thought });
        messages.push({ role: 'user', content: `[OBSERVATION] ${obsContent}` });
      } else if (!tool) {
        const errorEvent = { type: 'error' as const, content: `Tool not found: ${action.name}` };
        context.onEvent(errorEvent);
        yield errorEvent;
        break;
      } else if (tool.level === ToolLevel.L5_CRITICAL) {
        const errorEvent = { type: 'error' as const, content: 'This operation is forbidden for security reasons' };
        context.onEvent(errorEvent);
        yield errorEvent;
        break;
      } else if (tool.level >= ToolLevel.L3_MEDIUM_RISK) {
        const confirmId = this.toolRegistry.createPendingConfirmation(tool, action.args);
        const confirmEvent = { type: 'confirm_request' as const, confirmId, tool: action.name, requiresConfirm: true, details: action.args };
        context.onEvent(confirmEvent);
        yield confirmEvent;
        
        const result = await this.toolRegistry.approveConfirmation(confirmId);
        
        // 构建执行详情信息
        let actionContent = `Executing ${action.name}...`;
        if (result.executionDetails) {
          const { terminal, command, cwd } = result.executionDetails;
          actionContent = `Executing ${action.name}...\n[${terminal}] ${command}${cwd ? ` (cwd: ${cwd})` : ''}`;
        }
        
        // 确保 content 是字符串
        const resultContent = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
        const obsContent = result.success ? (resultContent || 'Done') : (result.error || 'Error');
        const actionEvent = { type: 'action' as const, content: actionContent, tool: action.name };
        const obsEvent = { type: 'observation' as const, content: obsContent };
        context.onEvent(actionEvent);
        context.onEvent(obsEvent);
        yield actionEvent;
        yield obsEvent;

        messages.push({ role: 'assistant', content: thought });
        messages.push({ role: 'user', content: `[OBSERVATION] ${obsContent}` });
      } else {
        // 检查工具是否启用
        if (!this.toolConfigService.isToolEnabled(action.name)) {
          const disabledEvent = {
            type: 'observation' as const,
            content: `工具 "${action.name}" 已禁用，无法执行`,
          };
          context.onEvent(disabledEvent);
          yield disabledEvent;
          messages.push({ role: 'assistant', content: thought });
          messages.push({ role: 'user', content: `[OBSERVATION] ${disabledEvent.content}` });
          continue;
        }

        const result = await this.toolRegistry.execute(action.name, action.args);

        // 构建执行详情信息
        let actionContent = `Executing ${action.name}...`;
        if (result.executionDetails) {
          const { terminal, command, cwd } = result.executionDetails;
          actionContent = `Executing ${action.name}...\n[${terminal}] ${command}${cwd ? ` (cwd: ${cwd})` : ''}`;
        }

        const actionEvent = { type: 'action' as const, content: actionContent, tool: action.name };
        context.onEvent(actionEvent);
        yield actionEvent;

        // 确保 content 是字符串
        const resultContent = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
        if (result.success) {
          const obsContent = resultContent || 'Done';
          const obsEvent = { type: 'observation' as const, content: obsContent };
          context.onEvent(obsEvent);
          yield obsEvent;
          messages.push({ role: 'assistant', content: thought });
          messages.push({ role: 'user', content: `[OBSERVATION] ${obsContent}` });
        } else {
          const errorContent = result.error || 'Error';
          const errorEvent = { type: 'error' as const, content: errorContent };
          context.onEvent(errorEvent);
          yield errorEvent;
          messages.push({ role: 'assistant', content: thought });
          messages.push({ role: 'user', content: `[OBSERVATION] ${errorContent}` });
        }
      }
    }

    // 循环结束后，确保发送 done 事件
    let finalContent = '';
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (typeof lastMsg.content === 'string' && lastMsg.content.startsWith('[OBSERVATION]')) {
        finalContent = lastMsg.content.replace('[OBSERVATION]', '').trim();
      }
    }
    if (!finalContent) {
      finalContent = 'Done';
    }
    const doneEvent = { type: 'done' as const, content: finalContent };
    context.onEvent(doneEvent);
    yield doneEvent;

    // 保存对话到长时记忆（仅当有实际对话内容时）
    if (enableMemory && userId && agentId && sessionId && userMessage.trim()) {
      try {
        // 将用户消息和回复拼接为记忆内容
        const memoryContent = `用户: ${userMessage}\n助手: ${finalContent}`;
        await this.memoryService.writeLongTerm(
          userId,
          agentId,
          memoryContent,
          sessionId,
          'conversation',
          { source: 'agent_executor' }
        );
        this.logger.log(`Memory saved for user=${userId}, agent=${agentId}, session=${sessionId}`);
      } catch (error: any) {
        this.logger.warn(`Failed to save memory: ${error.message}`);
      }
    }

    this.logger.log('AgentExecutor finished');
  }

  private parseAction(thought: string): { name: string; args: Record<string, any> } | null {
    // 匹配 [ACTION] tool_name {...}
    const actionMatch = thought.match(/\[ACTION\]\s*(\w+)\s*(\{.*\})/);
    if (actionMatch) {
      try {
        return {
          name: actionMatch[1],
          args: JSON.parse(actionMatch[2]),
        };
      } catch {
        // JSON 解析失败
      }
    }

    // 匹配 [REPLY] ... (直接回复，不需要工具)
    const replyMatch = thought.match(/\[REPLY\]/);
    if (replyMatch) {
      return null; // null 表示直接回复，不调用工具
    }

    return null;
  }

  private extractReply(thought: string): string | null {
    // 深度思考模型可能分阶段输出：
    // 1. 思考过程（可能包含 <thinking> 等标记）
    // 2. 最终回复（[REPLY] 或 [ACTION]）
    
    // 首先检查是否有 [ACTION] 标记 - 如果有，说明需要调用工具，不提取回复
    if (thought.includes('[ACTION]')) {
      return null;
    }
    
    // 检查是否有 [REPLY] 标记 - 只取最后一个 [REPLY] 后的内容
    const replyMatch = thought.match(/\[REPLY\][\s\S]*$/);
    if (replyMatch) {
      return replyMatch[0].replace(/^\[REPLY\]/, '').trim();
    }
    
    // 如果没有标记，检查是否完全没有 [ACTION] - 可能是纯回复（直接输出，不走工具）
    if (!thought.includes('[ACTION]') && !thought.includes('[REPLY]')) {
      // 对于深度思考模型，可能输出格式是：
      // <thinking>思考内容...</thinking>
      // 最终回复内容
      // 需要提取最后非思考部分的内容
      const thinkingEndMatch = thought.match(/<\/thinking>[\s\S]*$/i);
      if (thinkingEndMatch) {
        const afterThinking = thinkingEndMatch[0].replace(/<\/thinking>/i, '').trim();
        if (afterThinking) {
          return afterThinking;
        }
      }
      
      // 否则返回全部内容（作为纯回复）
      return thought.trim();
    }

    return null;
  }
}
