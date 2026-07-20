import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { McpClientService } from './mcp-client.service';
import { McpServerService } from './mcp-server.service';
import { McpServer } from '../../entities/mcp-server.entity';
import { McpController } from './mcp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([McpServer])],
  controllers: [McpController],
  providers: [McpClientService, McpServerService],
  exports: [McpClientService, McpServerService],
})
export class McpModule {}
