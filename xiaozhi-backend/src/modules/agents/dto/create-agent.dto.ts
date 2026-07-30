import { IsString, IsOptional, IsArray, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiProperty({ description: '智能体名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '智能体描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '头像 URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: '模型 ID' })
  @IsString()
  modelId: string;

  @ApiPropertyOptional({ description: '系统提示词' })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiPropertyOptional({ description: '工具名称列表' })
  @IsOptional()
  @IsArray()
  toolNames?: string[];

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'MCP 服务器名称列表' })
  @IsOptional()
  @IsArray()
  mcpServers?: string[];

  @ApiPropertyOptional({ description: '是否锁定' })
  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @ApiPropertyOptional({ description: '英文标识名' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: '智能体设置' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
