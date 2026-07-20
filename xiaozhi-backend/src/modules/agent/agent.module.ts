import { Module } from '@nestjs/common';
import { AgentExecutor } from './agent-executor.service';
import { AgentController } from './agent.controller';
import { ToolsModule } from '../tools/tools.module';
import { AIModule } from '../ai/ai.module';
import { McpModule } from '../mcp/mcp.module';

@Module({
  imports: [ToolsModule, AIModule, McpModule],
  controllers: [AgentController],
  providers: [AgentExecutor],
  exports: [AgentExecutor],
})
export class AgentModule {}
