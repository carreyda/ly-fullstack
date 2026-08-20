import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from '../health/health.module';

const appEnv = process.env.APP_ENV || 'development';

/**
 * C 端 API 根模块
 *
 * 当前只装配环境配置和健康检查。C 端 JWT、用户体系与业务模块将在对应阶段独立实现，
 * 不复用 admin-api 的管理端认证边界。
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${appEnv}`, '.env'],
    }),
    HealthModule,
  ],
})
export class AppModule {}
