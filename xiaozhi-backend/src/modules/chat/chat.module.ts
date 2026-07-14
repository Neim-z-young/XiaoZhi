import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Session } from '../../entities/session.entity';
import { Message } from '../../entities/message.entity';
import { Agent } from '../../entities/agent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Message, Agent])],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
