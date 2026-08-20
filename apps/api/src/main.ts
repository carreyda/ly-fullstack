import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

import { SERVER_CORS_METHODS, SERVER_DEFAULT_PORT } from './constants';
import { AppModule } from './modules/app/app.module';

/**
 * 启动 LY Fullstack C 端 API 服务
 */
const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
    }),
  );

  const configService = app.get(ConfigService);
  const corsOrigins = (configService.get<string>('CORS_ORIGINS') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix('api');

  if (corsOrigins.length > 0) {
    app.enableCors({
      origin: corsOrigins,
      methods: SERVER_CORS_METHODS,
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', SERVER_DEFAULT_PORT);
  await app.listen(port, '0.0.0.0');
};

void bootstrap().catch((error: unknown) => {
  console.error('LY Fullstack API 启动失败：', error);
  process.exitCode = 1;
});
