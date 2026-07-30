import { Module } from '@nestjs/common';
import { AIGatewayService } from './ai-gateway.service';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [AIGatewayService],
  exports: [AIGatewayService],
})
export class AIModule {}
