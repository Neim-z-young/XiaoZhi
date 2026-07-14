import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
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

  @ApiPropertyOptional({ description: '插件 ID 列表' })
  @IsOptional()
  @IsArray()
  pluginIds?: string[];

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
