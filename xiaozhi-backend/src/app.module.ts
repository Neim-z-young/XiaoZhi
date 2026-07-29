import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/configuration';
import { AgentsModule } from './modules/agents/agents.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ChatModule } from './modules/chat/chat.module';
import { PluginsModule } from './modules/plugins/plugins.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { MemoryModule } from './modules/memory/memory.module';
import { SystemModule } from './modules/system/system.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { AIModule } from './modules/ai/ai.module';
import { ModelsModule } from './modules/models/models.module';
import { McpModule } from './modules/mcp/mcp.module';
import { SandboxModule } from './modules/sandbox/sandbox.module';
import { ToolsModule } from './modules/tools/tools.module';
import { AgentModule } from './modules/agent/agent.module';

// 实体
import { User } from './entities/user.entity';
import { Agent } from './entities/agent.entity';
import { Plugin } from './entities/plugin.entity';
import { Session } from './entities/session.entity';
import { Message } from './entities/message.entity';
import { Workspace } from './entities/workspace.entity';
import { KnowledgeBase } from './entities/knowledge-base.entity';
import { McpServer } from './entities/mcp-server.entity';
import { Tool } from './entities/tool.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('database.type') || 'sqlite';
        
        if (dbType === 'sqlite') {
          return {
            type: 'sqljs',
            location: 'xiaozhi',
            autoSave: true,
            entities: [User, Agent, Plugin, Session, Message, Workspace, KnowledgeBase, McpServer, Tool],
            synchronize: true,
            logging: false,
          };
        }
        
        // PostgreSQL 配置
        return {
          type: 'postgres',
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          username: configService.get('database.username'),
          password: configService.get('database.password'),
          database: configService.get('database.database'),
          entities: [User, Agent, Plugin, Session, Message, Workspace, KnowledgeBase, McpServer, Tool],
          synchronize: true,
          logging: false,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    AgentsModule,
    SessionsModule,
    ChatModule,
    PluginsModule,
    KnowledgeModule,
    MemoryModule,
    SystemModule,
    WorkspaceModule,
    AIModule,
    ModelsModule,
    McpModule,
    SandboxModule,
    ToolsModule,
    AgentModule,
  ],
})
export class AppModule {}
