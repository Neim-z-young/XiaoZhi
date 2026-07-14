import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局路由前缀
  app.setGlobalPrefix('api');
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const host = configService.get<string>('app.host') || '0.0.0.0';

  // 全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API 文档
  const swaggerConfig = new DocumentBuilder()
    .setTitle('小智 XiaoZhi API')
    .setDescription('插件化 AI 助手平台后端 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, host);
  console.log(`Application is running on: http://${host}:${port}`);
  console.log(`API Docs: http://${host}:${port}/api/docs`);
}
bootstrap();
