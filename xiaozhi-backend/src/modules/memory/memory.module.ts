import { Module } from '@nestjs/common';
import { MemoryController } from './memory.controller';
import { MemoryService } from './memory.service';
import { RedisService } from './redis.service';

@Module({
  imports: [],
  controllers: [MemoryController],
  providers: [MemoryService, RedisService],
  exports: [MemoryService],
})
export class MemoryModule {}
