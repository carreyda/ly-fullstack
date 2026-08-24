import 'reflect-metadata';

import helmet from '@fastify/helmet';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

import { SERVER_CORS_METHODS } from './constants';
import { AppModule } from './modules/app/app.module';

/**
 * 启动 LY Fullstack 默认 C 端 API
 */
const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true, trustProxy: 'loopback' }),
  );
  await app.register(helmet);

  const configService = app.get(ConfigService);
  const corsOrigins = configService
    .getOrThrow<string>('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: corsOrigins, methods: SERVER_CORS_METHODS });
  app.enableShutdownHooks();

  const port = Number(configService.getOrThrow<string>('PORT'));
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT 必须是 1 到 65535 之间的整数');
  }
  await app.listen(port, '0.0.0.0');
};

void bootstrap().catch((error: unknown) => {
  console.error('LY Fullstack API 启动失败：', error);
  process.exitCode = 1;
});
