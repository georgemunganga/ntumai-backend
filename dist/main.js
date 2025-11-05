"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Ntumai API - Auth Module')
        .setDescription('Authentication API with OTP-first wizard flow. Supports email and phone-based authentication with JWT tokens.')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Authentication', 'OTP-first authentication endpoints')
        .setContact('Ntumai Support', 'https://ntumai.com', 'support@ntumai.com')
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'Ntumai API Documentation',
        customfavIcon: 'https://ntumai.com/favicon.ico',
        customCss: '.swagger-ui .topbar { display: none }',
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`
    🚀 Application is running on: http://localhost:${port}
    📚 Swagger documentation: http://localhost:${port}/api/docs
    🔐 Base API URL: http://localhost:${port}/api/v1
  `);
}
bootstrap();
//# sourceMappingURL=main.js.map