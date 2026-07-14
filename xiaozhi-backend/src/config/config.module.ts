import { Module, Global } from '@nestjs/common';
import { ConfigService } from './configuration';
import { ModelConfigService } from './model-config.service';

@Global()
@Module({
  providers: [ConfigService, ModelConfigService],
  exports: [ConfigService, ModelConfigService],
})
export class ConfigModule {}
