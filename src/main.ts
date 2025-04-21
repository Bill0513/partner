import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { FormatResponseInterceptor } from './format-response.interceptor';
import { InvokeRecordInterceptor } from './invoke-record.interceptor';
import { CustomExceptionFilter } from './custom-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('/api');

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new FormatResponseInterceptor());
  app.useGlobalInterceptors(new InvokeRecordInterceptor());
  app.useGlobalFilters(new CustomExceptionFilter());

  app.enableCors({
    // origin: '*', // 允许任何来源 - 开发时可以，生产环境建议指定明确来源
    origin: [
        'http://localhost:4000', // 你的前端本地开发环境地址 (替换 xxxx 为你的端口号)
        'https://ppp-six-nu.vercel.app', // 你部署在 Vercel 上的前端项目地址
        // 如果还有其他允许的来源，也加在这里
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // 允许的方法
    allowedHeaders: 'Content-Type, Accept, Authorization', // 允许的请求头，确保包含 Authorization (如果你用了 Bearer Token) 和 Content-Type
    credentials: true, // 允许携带凭证 (例如 cookies, Authorization header)
  });

  app.useStaticAssets('uploads', {
    prefix: '/uploads',
  });

  const config = new DocumentBuilder()
    .setTitle('会议室预定系统')
    .setDescription('api 接口文档')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      description: '基于 jwt 的认证',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, document);

  await app.listen(process.env.PORT);

  console.log(`Application is running on: ${await app.getUrl()}`); // 可以在日志中看到实际监听地址
}
bootstrap();
