import { Client } from '@modelcontextprotocol/sdk/client/index.js';
export interface McpClientConfig {
    id: string;
    name: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
    cwd?: string;
}
export interface ToolCallResult {
    success: boolean;
    content: Array<{
        type: 'text';
        text: string;
    }>;
    error?: string;
}
export declare class McpClientService {
    private readonly logger;
    private clients;
    connect(config: McpClientConfig): Promise<Client>;
    disconnect(clientId: string): Promise<void>;
    listTools(clientId: string): Promise<any[]>;
    callTool(clientId: string, toolName: string, args: Record<string, any>): Promise<ToolCallResult>;
    getClient(clientId: string): Client | undefined;
    getConnectedClients(): string[];
}
