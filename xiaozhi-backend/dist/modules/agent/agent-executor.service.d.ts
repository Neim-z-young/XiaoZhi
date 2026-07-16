import { ToolRegistry } from '../tools/tool-registry.service';
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
export declare class AgentExecutor {
    private readonly toolRegistry;
    private readonly aiGateway;
    private readonly logger;
    constructor(toolRegistry: ToolRegistry, aiGateway: AIGatewayService);
    execute(userMessage: string, config: AgentConfig, context: {
        onEvent: (event: AgentStreamEvent) => void;
        messages: Array<{
            role: 'user' | 'assistant' | 'system';
            content: string;
        }>;
    }): AsyncGenerator<AgentStreamEvent>;
    private think;
    private parseAction;
    private extractReply;
}
