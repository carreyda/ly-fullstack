import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

import { SERVER_CORS_METHODS } from './constants';
import { AppModule } from './modules/app/app.module';

/**
 * 启动 LY Fullstack 管理 API 服务
 *
 * 服务端使用 NestJS + Fastify，只承载 API 能力，不承载任何页面渲染链路。
 */
const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
    }),
  );

  const configService = app.get(ConfigService);
  const corsOrigins = configService
    .getOrThrow<string>('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix('api');

  /**
   * 只允许当前环境明确配置的前端来源跨域访问 API
   *
   * 开发环境浏览器可能同时使用 `localhost` 与 `127.0.0.1` 访问管理端，两个来源都必须写入
   * 环境变量白名单；未进入白名单的来源不会获得 CORS 响应头。
   */
  app.enableCors({
    origin: corsOrigins,
    methods: SERVER_CORS_METHODS,
  });

  /**
   * 对所有 DTO 启用运行时校验：剔除声明外字段、拒绝额外输入，并把请求体转换为 DTO 实例。
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * 收到 SIGINT 或 SIGTERM 时触发 Prisma 的模块销毁钩子，确保 PostgreSQL 连接池被正确释放。
   */
  app.enableShutdownHooks();

  const port = Number(configService.getOrThrow<string>('PORT'));
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT 必须是 1 到 65535 之间的整数');
  }
  await app.listen(port, '0.0.0.0');
};

void bootstrap().catch((error: unknown) => {
  console.error('LY Fullstack Admin API 启动失败：', error);
  process.exitCode = 1;
});
