import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolRegistry } from './tool-registry.service';
import { ToolService } from './tool.service';
import { ToolConfigService } from './tool-config.service';
import { ToolController } from './tool.controller';
import { Tool } from '../../entities/tool.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tool])],
  controllers: [ToolController],
  providers: [ToolRegistry, ToolService, ToolConfigService],
  exports: [ToolRegistry, ToolService, ToolConfigService],
})
export class ToolsModule {}
