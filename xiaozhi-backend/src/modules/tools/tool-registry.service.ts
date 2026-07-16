import { Injectable, Logger } from '@nestjs/common';

export enum ToolLevel {
  L1_SAFE = 1,       // 只读操作，直接执行
  L2_LOW_RISK = 2,   // 无破坏性写操作，直接执行
  L3_MEDIUM_RISK = 3, // 需要用户确认
  L4_HIGH_RISK = 4,   // 需要明确审批
  L5_CRITICAL = 5,    // 完全禁止
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  level: ToolLevel;
  handler: (...args: any[]) => Promise<any>;
  requiresConfirm?: boolean;
}

export interface ToolCall {
  id: string;
  toolName: string;
  arguments: Record<string, any>;
  level: ToolLevel;
  timestamp: Date;
}

export interface ToolResult {
  success: boolean;
  content?: string;
  error?: string;
  logs?: string[];
}

@Injectable()
export class ToolRegistry {
  private readonly logger = new Logger(ToolRegistry.name);
  private tools = new Map<string, ToolDefinition>();
  private pendingConfirmations = new Map<string, ToolCall>();
  // 用于存储等待批准的 Promise resolve 函数
  private pendingApprovalResolvers = new Map<string, (result: ToolResult) => void>();
  // 用于存储已批准的结果
  private approvedResults = new Map<string, ToolResult>();

  register(definition: ToolDefinition): void {
    if (this.tools.has(definition.name)) {
      this.logger.warn(`Tool ${definition.name} is already registered, overwriting`);
    }
    this.tools.set(definition.name, definition);
    this.logger.log(`Registered tool: ${definition.name} (Level ${definition.level})`);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async execute(
    name: string,
    args: Record<string, any>,
    userId?: string,
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, error: `Tool not found: ${name}` };
    }

    // L5 危险操作直接拒绝
    if (tool.level === ToolLevel.L5_CRITICAL) {
      return { success: false, error: 'This operation is forbidden for security reasons' };
    }

    // L3 及以上需要确认
    if (tool.level >= ToolLevel.L3_MEDIUM_RISK) {
      const callId = this.createPendingConfirmation(tool, args, userId);
      return {
        success: false,
        error: `Confirmation required (${callId})`,
      };
    }

    // L1/L2 直接执行
    try {
      const result = await tool.handler(args);
      return { success: true, content: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  createPendingConfirmation(
    tool: ToolDefinition,
    args: Record<string, any>,
    userId?: string,
  ): string {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const call: ToolCall = {
      id: callId,
      toolName: tool.name,
      arguments: args,
      level: tool.level,
      timestamp: new Date(),
    };
    this.pendingConfirmations.set(callId, call);
    return callId;
  }

  getPendingConfirmation(callId: string): ToolCall | undefined {
    return this.pendingConfirmations.get(callId);
  }

  getPendingConfirmations(userId?: string): ToolCall[] {
    return Array.from(this.pendingConfirmations.values()).filter(
      c => c.level >= ToolLevel.L3_MEDIUM_RISK,
    );
  }

  async approveConfirmation(callId: string): Promise<ToolResult> {
    const call = this.pendingConfirmations.get(callId);
    if (!call) {
      return { success: false, error: 'Confirmation not found' };
    }

    // 如果已经有批准结果，直接返回
    const existingResult = this.approvedResults.get(callId);
    if (existingResult) {
      this.approvedResults.delete(callId);
      this.pendingConfirmations.delete(callId);
      return existingResult;
    }

    // 如果没有结果，说明需要等待外部批准
    // 创建一个 Promise 并存储 resolve 函数，等待外部调用 setApprovalResult
    return new Promise<ToolResult>((resolve) => {
      this.pendingApprovalResolvers.set(callId, (result: ToolResult) => {
        resolve(result);
        this.pendingApprovalResolvers.delete(callId);
      });
      this.logger.log(`Waiting for external approval: ${callId}`);
    });
  }

  // 外部批准后调用此方法设置结果
  setApprovalResult(callId: string, result: ToolResult): void {
    console.log(`[ToolRegistry] setApprovalResult called: ${callId}, result: ${JSON.stringify(result)}`);
    console.log(`[ToolRegistry] pendingApprovalResolvers keys: ${Array.from(this.pendingApprovalResolvers.keys()).join(', ')}`);
    const resolve = this.pendingApprovalResolvers.get(callId);
    if (resolve) {
      console.log(`[ToolRegistry] Resolving promise for: ${callId}`);
      resolve(result);
      this.pendingApprovalResolvers.delete(callId);
    } else {
      // 如果没有等待的 Promise，直接存储结果
      console.log(`[ToolRegistry] No pending resolver, storing result for future pickup: ${callId}`);
      this.approvedResults.set(callId, result);
    }
  }

  // 外部拒绝后调用此方法
  rejectApproval(callId: string): void {
    const resolve = this.pendingApprovalResolvers.get(callId);
    if (resolve) {
      this.logger.log(`Rejecting approval for: ${callId}`);
      resolve({ success: false, error: 'Rejected by user' });
      this.pendingApprovalResolvers.delete(callId);
    }
    this.pendingConfirmations.delete(callId);
  }

  // 删除待确认记录
  deletePendingConfirmation(callId: string): void {
    this.pendingConfirmations.delete(callId);
  }

  rejectConfirmation(callId: string): void {
    this.pendingConfirmations.delete(callId);
  }
}
