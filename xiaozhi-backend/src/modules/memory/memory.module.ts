import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemoryController } from './memory.controller';
import { MemoryService } from './memory.service';
import { RedisService } from './redis.service';
import { LongTermMemory } from '../../entities/memory.entity';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LongTermMemory]),
    AIModule,
  ],
  controllers: [MemoryController],
  providers: [MemoryService, RedisService],
  exports: [MemoryService],
})
export class MemoryModule {}
