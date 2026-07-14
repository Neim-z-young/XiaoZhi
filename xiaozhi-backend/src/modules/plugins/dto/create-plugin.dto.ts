import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePluginDto {
  @ApiProperty({ description: '插件类型', enum: ['mcp', 'a2a', 'builtin'] })
  @IsString()
  type: 'mcp' | 'a2a' | 'builtin';

  @ApiProperty({ description: '插件配置' })
  @IsObject()
  config: Record<string, any>;
}
