export declare enum ToolLevel {
    L1_SAFE = 1,
    L2_LOW_RISK = 2,
    L3_MEDIUM_RISK = 3,
    L4_HIGH_RISK = 4,
    L5_CRITICAL = 5
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
export declare class ToolRegistry {
    private readonly logger;
    private tools;
    private pendingConfirmations;
    private pendingApprovalResolvers;
    private approvedResults;
    register(definition: ToolDefinition): void;
    unregister(name: string): boolean;
    getTool(name: string): ToolDefinition | undefined;
    listTools(): ToolDefinition[];
    execute(name: string, args: Record<string, any>, userId?: string): Promise<ToolResult>;
    createPendingConfirmation(tool: ToolDefinition, args: Record<string, any>, userId?: string): string;
    getPendingConfirmation(callId: string): ToolCall | undefined;
    getPendingConfirmations(userId?: string): ToolCall[];
    approveConfirmation(callId: string): Promise<ToolResult>;
    setApprovalResult(callId: string, result: ToolResult): void;
    rejectApproval(callId: string): void;
    deletePendingConfirmation(callId: string): void;
    rejectConfirmation(callId: string): void;
}
