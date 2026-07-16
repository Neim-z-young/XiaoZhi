import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

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
  content: Array<{ type: 'text'; text: string }>;
  error?: string;
}

@Injectable()
export class McpClientService {
  private readonly logger = new Logger(McpClientService.name);
  private clients = new Map<string, Client>();

  async connect(config: McpClientConfig): Promise<Client> {
    if (this.clients.has(config.id)) {
      return this.clients.get(config.id)!;
    }

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: config.env,
      cwd: config.cwd,
    });

    const client = new Client(
      {
        name: config.name || 'xiaozhi-mcp-client',
        version: '1.0.0',
      },
      { capabilities: { sampling: {}, tools: {} } } as any,
    );

    try {
      await client.connect(transport);
      this.clients.set(config.id, client);
      this.logger.log(`MCP client connected: ${config.id}`);
      return client;
    } catch (error: any) {
      this.logger.error(`Failed to connect MCP client: ${error.message}`);
      throw error;
    }
  }

  async disconnect(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (client) {
      await client.close();
      this.clients.delete(clientId);
      this.logger.log(`MCP client disconnected: ${clientId}`);
    }
  }

  async listTools(clientId: string): Promise<any[]> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`MCP client not found: ${clientId}`);
    }
    const response = await client.listTools();
    return (response as any).tools || [];
  }

  async callTool(
    clientId: string,
    toolName: string,
    args: Record<string, any>,
  ): Promise<ToolCallResult> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`MCP client not found: ${clientId}`);
    }

    try {
      const result = await client.callTool({ name: toolName, arguments: args });
      return {
        success: true,
        content: result.content as Array<{ type: 'text'; text: string }>,
      };
    } catch (error: any) {
      this.logger.error(`Tool call failed: ${error.message}`);
      return {
        success: false,
        content: [],
        error: error.message,
      };
    }
  }

  getClient(clientId: string): Client | undefined {
    return this.clients.get(clientId);
  }

  getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }
}
