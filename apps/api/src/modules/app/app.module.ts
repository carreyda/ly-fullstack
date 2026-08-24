import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../prisma/prisma.module';
import { HealthModule } from '../health/health.module';
import { PublicConfigModule } from '../public-config/public-config.module';
import { PublicDictionaryModule } from '../public-dictionary/public-dictionary.module';

const appEnv = process.env.APP_ENV || 'development';

/**
 * 默认 C 端 API 根模块
 *
 * 只提供健康检查、公共字典和公共配置，不预设任何具体 C 端业务，也不依赖管理 API 应用。
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: `.env.${appEnv}` }),
    PrismaModule,
    HealthModule,
    PublicDictionaryModule,
    PublicConfigModule,
  ],
})
export class AppModule {}
