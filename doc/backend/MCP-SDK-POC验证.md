# MCP SDK POC 验证

## 目标

验证 `@modelcontextprotocol/sdk` 在 NestJS 中的集成可行性。

## 1. MCP Server 集成

### 安装依赖
```bash
npm install @modelcontextprotocol/sdk
```

### 创建 MCP Server 模块
```typescript
// mcp-server.service.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

@Injectable()
export class McpServerService {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'xiaozhi-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_weather',
          description: '获取天气信息',
          inputSchema: {
            type: 'object',
            properties: {
              city: { type: 'string', description: '城市名称' },
            },
          },
        },
      ],
    }));

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async ({ name, arguments: args }) => {
      if (name === 'get_weather') {
        return {
          content: [
            { type: 'text', text: `${args.city} 的天气是晴天，25度` },
          ],
        };
      }
      throw new Error(`Unknown tool: ${name}`);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('MCP Server started');
  }
}
```

## 2. MCP Client 集成

### 创建 MCP Client 模块
```typescript
// mcp-client.service.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

@Injectable()
export class McpClientService {
  private clients = new Map<string, Client>();

  async connect(pluginId: string, command: string, args: string[]): Promise<Client> {
    const transport = new StdioClientTransport({
      command,
      args,
    });

    const client = new Client(
      {
        name: 'xiaozhi-mcp-client',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    await client.connect(transport);
    this.clients.set(pluginId, client);
    return client;
  }

  async disconnect(pluginId: string): Promise<void> {
    const client = this.clients.get(pluginId);
    if (client) {
      await client.close();
      this.clients.delete(pluginId);
    }
  }

  async listTools(pluginId: string) {
    const client = this.clients.get(pluginId);
    if (!client) throw new Error(`Client ${pluginId} not connected`);
    return client.request({ method: 'tools/list' }, ListToolsRequestSchema);
  }

  async callTool(pluginId: string, toolName: string, args: Record<string, any>) {
    const client = this.clients.get(pluginId);
    if (!client) throw new Error(`Client ${pluginId} not connected`);
    return client.request(
      { method: 'tools/call', params: { name: toolName, arguments: args } },
      CallToolRequestSchema
    );
  }
}
```

## 3. 插件服务集成

```typescript
// plugins.service.ts
import { McpClientService } from './mcp-client.service';

@Injectable()
export class PluginsService {
  constructor(private mcpClient: McpClientService) {}

  async installMcpPlugin(config: { name: string; command: string; args: string[] }) {
    const client = await this.mcpClient.connect(
      config.name,
      config.command,
      config.args
    );
    
    const tools = await this.mcpClient.listTools(config.name);
    return { client, tools };
  }
}
```

## POC 结果

| 项目 | 状态 | 说明 |
|------|------|------|
| MCP Server | 待验证 | 通过 STDIO 通信 |
| MCP Client | 待验证 | 连接外部 MCP Server |
| 工具调用 | 待验证 | 跨进程通信 |

## 已知限制

1. **STDIO 通信**：MCP 使用标准输入输出通信，不支持 HTTP
2. **进程管理**：需要启动和管理子进程
3. **Windows 兼容**：STDIO 在 Windows 上可能有问题

## 结论

MCP SDK 集成方案可行，但需要：
1. 使用进程管理（spawn）而非直接 import
2. 处理 STDIO 的特殊编码
3. 实现重连和超时机制
