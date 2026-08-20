import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from '../health/health.module';
import { PrismaModule } from '../../prisma/prisma.module';

const appEnv = process.env.APP_ENV || 'development';

/**
 * 服务端根模块
 *
 * 作为 NestJS 模块装配入口，只聚合环境配置、健康检查和数据访问模块，不承载业务逻辑。
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${appEnv}`, '.env'],
    }),
    HealthModule,
    PrismaModule,
  ],
})
export class AppModule {}
