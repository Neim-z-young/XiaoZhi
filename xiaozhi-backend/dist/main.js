"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const configuration_1 = require("./config/configuration");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    const configService = app.get(configuration_1.ConfigService);
    const port = configService.get('app.port') || 3000;
    const host = configService.get('app.host') || '0.0.0.0';
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('小智 XiaoZhi API')
        .setDescription('插件化 AI 助手平台后端 API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.listen(port, host);
    console.log(`Application is running on: http://${host}:${port}`);
    console.log(`API Docs: http://${host}:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map