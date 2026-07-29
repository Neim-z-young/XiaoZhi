import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelsController } from './models.controller';
import { Model } from '../../entities/model.entity';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Model]), AIModule],
  controllers: [ModelsController],
  exports: [TypeOrmModule],
})
export class ModelsModule {}
