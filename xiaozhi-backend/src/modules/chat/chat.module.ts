import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatStreamService } from './chat-stream.service';
import { Session } from '../../entities/session.entity';
import { Message } from '../../entities/message.entity';
import { Agent } from '../../entities/agent.entity';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Message, Agent]), AIModule],
  controllers: [ChatController],
  providers: [ChatService, ChatStreamService],
  exports: [ChatService],
})
export class ChatModule {}
