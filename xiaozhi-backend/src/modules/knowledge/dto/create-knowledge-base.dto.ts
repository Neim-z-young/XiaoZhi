import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKnowledgeBaseDto {
  @ApiProperty({ description: '知识库名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '知识库描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '知识库设置' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
