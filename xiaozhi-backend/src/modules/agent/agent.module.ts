import { Module } from '@nestjs/common';
import { AgentExecutor } from './agent-executor.service';
import { AgentController } from './agent.controller';
import { ToolsModule } from '../tools/tools.module';
import { AIModule } from '../ai/ai.module';
import { McpModule } from '../mcp/mcp.module';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [ToolsModule, AIModule, McpModule, WorkspaceModule],
  controllers: [AgentController],
  providers: [AgentExecutor],
  exports: [AgentExecutor],
})
export class AgentModule {}
