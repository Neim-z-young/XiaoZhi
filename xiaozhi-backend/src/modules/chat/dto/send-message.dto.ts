import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: '会话 ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: '消息内容' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: '是否流式输出', default: true })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}
