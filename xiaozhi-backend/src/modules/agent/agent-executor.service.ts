import { Injectable, Logger } from '@nestjs/common';
import { ToolRegistry, ToolLevel } from '../tools/tool-registry.service';
import { AIGatewayService } from '../ai/ai-gateway.service';

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
  model: string;
  maxIterations?: number;
  systemPrompt?: string;
}

export interface AgentStreamEvent {
  type: 'thought' | 'action' | 'observation' | 'confirm_request' | 'done' | 'error';
  content?: string;
  tool?: string;
  requiresConfirm?: boolean;
  confirmId?: string;
  details?: any;
}

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

@Injectable()
export class AgentExecutor {
  private readonly logger = new Logger(AgentExecutor.name);

  constructor(
    private readonly toolRegistry: ToolRegistry,
    private readonly aiGateway: AIGatewayService,
  ) {}

  async *execute(
    userMessage: string,
    config: AgentConfig,
    context: {
      onEvent: (event: AgentStreamEvent) => void;
      messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    },
  ): AsyncGenerator<AgentStreamEvent> {
    const maxIterations = config.maxIterations || 10;

    let messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...context.messages,
      { role: 'user' as const, content: userMessage },
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
        // 直接回复，先发送 done 事件，再 yield
        const doneEvent = { type: 'done' as const, content: reply || thought };
        context.onEvent(doneEvent);
        yield doneEvent;
        break;
      }

      yield { type: 'thought', content: thought };
      context.onEvent({ type: 'thought', content: thought });

      const tool = this.toolRegistry.getTool(action.name);
      if (!tool) {
        const errorEvent = { type: 'error' as const, content: `Tool not found: ${action.name}` };
        context.onEvent(errorEvent);
        yield errorEvent;
        break;
      }

      if (tool.level === ToolLevel.L5_CRITICAL) {
        const errorEvent = { type: 'error' as const, content: 'This operation is forbidden for security reasons' };
        context.onEvent(errorEvent);
        yield errorEvent;
        break;
      }

      if (tool.level >= ToolLevel.L3_MEDIUM_RISK) {
        const confirmId = this.toolRegistry.createPendingConfirmation(tool, action.args);
        const confirmEvent = { type: 'confirm_request' as const, confirmId, tool: action.name, requiresConfirm: true, details: action.args };
        context.onEvent(confirmEvent);
        yield confirmEvent;
        
        const result = await this.toolRegistry.approveConfirmation(confirmId);
        
        const obsContent = result.success ? (result.content || 'Done') : (result.error || 'Error');
        const actionEvent = { type: 'action' as const, content: `Executing ${action.name}...`, tool: action.name };
        const obsEvent = { type: 'observation' as const, content: obsContent };
        context.onEvent(actionEvent);
        context.onEvent(obsEvent);
        yield actionEvent;
        yield obsEvent;

        messages.push({ role: 'assistant', content: thought });
        messages.push({ role: 'user', content: `[OBSERVATION] ${obsContent}` });
      } else {
        const actionEvent = { type: 'action' as const, content: `Executing ${action.name}...`, tool: action.name };
        context.onEvent(actionEvent);
        yield actionEvent;

        const result = await this.toolRegistry.execute(action.name, action.args);

        if (result.success) {
          const obsContent = result.content || 'Done';
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
    
    this.logger.log('AgentExecutor finished');
  }

  private async think(
    messages: Array<{ role: string; content: string }>,
    model: string,
  ): Promise<string> {
    this.logger.log(`think() called with model: ${model}, message count: ${messages.length}`);
    try {
      // 添加超时机制
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI request timeout (60s)')), 60000);
      });

      const response = await Promise.race([
        this.aiGateway.complete({
          model,
          messages: messages.map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
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
    } catch (error: any) {
      this.logger.error(`think() AI error: ${error.message}`);
      return `Error: ${error.message}`;
    }
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
    const replyMatch = thought.match(/\[REPLY\]\s*(.*)/);
    if (replyMatch) {
      return null; // null 表示直接回复
    }

    return null;
  }

  private extractReply(thought: string): string | null {
    const replyMatch = thought.match(/\[REPLY\]\s*(.*)/);
    if (replyMatch) {
      return replyMatch[1].trim();
    }
    // 如果没有 [REPLY] 标记，检查是否也没有 [ACTION]，如果有就是纯回复
    if (!thought.includes('[ACTION]')) {
      return thought.trim();
    }
    return null;
  }
}
