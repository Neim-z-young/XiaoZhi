import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './configuration';
import { ModelConfigService } from './model-config.service';
import { Model } from '../entities/model.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Model])],
  providers: [ConfigService, ModelConfigService],
  exports: [ConfigService, ModelConfigService, TypeOrmModule],
})
export class ConfigModule {}
