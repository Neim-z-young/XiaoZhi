import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateAgentDto {
  @ApiProperty({ description: '待解析的内容' })
  @IsString()
  content: string;

  @ApiProperty({ description: '使用的模型 ID' })
  @IsString()
  modelId: string;
}
