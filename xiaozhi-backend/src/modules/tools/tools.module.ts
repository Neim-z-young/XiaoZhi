import { Module } from '@nestjs/common';
import { ToolRegistry } from './tool-registry.service';
import { ToolService } from './tool.service';
import { ToolConfirmController } from './tool-confirm.controller';

@Module({
  controllers: [ToolConfirmController],
  providers: [ToolRegistry, ToolService],
  exports: [ToolRegistry, ToolService],
})
export class ToolsModule {}
