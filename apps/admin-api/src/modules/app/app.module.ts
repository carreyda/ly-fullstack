import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { HealthModule } from '../health/health.module';
import { PrismaModule } from '../../prisma/prisma.module';

const appEnv = process.env.APP_ENV || 'development';

/**
 * 服务端根模块
 *
 * 作为 NestJS 模块装配入口，聚合环境配置、管理端认证、健康检查和数据访问模块，不承载业务逻辑。
 * JWT、RBAC 和健康检查继续保留各自模块边界，根模块只负责声明应用依赖关系。
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${appEnv}`, '.env'],
    }),
    AuthModule,
    HealthModule,
    PrismaModule,
  ],
})
export class AppModule {}
