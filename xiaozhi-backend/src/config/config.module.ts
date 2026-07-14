import { Module, Global } from '@nestjs/common';
import { ConfigService } from './configuration';

@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
