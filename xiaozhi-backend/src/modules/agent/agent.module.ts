import { Module } from '@nestjs/common';
import { AgentExecutor } from './agent-executor.service';
import { AgentController } from './agent.controller';
import { ToolsModule } from '../tools/tools.module';
import { AIModule } from '../ai/ai.module';
import { McpModule } from '../mcp/mcp.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { MemoryModule } from '../memory/memory.module';
import { ConfigModule } from '../../config/config.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [ConfigModule, ToolsModule, AIModule, McpModule, WorkspaceModule, MemoryModule, AgentsModule],
  controllers: [AgentController],
  providers: [AgentExecutor],
  exports: [AgentExecutor],
})
export class AgentModule {}
