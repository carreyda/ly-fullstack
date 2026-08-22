import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { HealthModule } from '../health/health.module';
import { MenuModule } from '../menu/menu.module';
import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../../prisma/prisma.module';

const appEnv = process.env.APP_ENV || 'development';

/**
 * 服务端根模块
 *
 * 作为 NestJS 模块装配入口，聚合环境配置、管理端认证、健康检查和数据访问模块，不承载业务逻辑。
 * JWT、RBAC 和健康检查继续保留各自模块边界，根模块只负责声明应用依赖关系。
 * 环境配置严格读取当前应用的 `.env.<APP_ENV>`，不回退读取仓库根文件，避免多个服务共享私密变量。
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${appEnv}`,
    }),
    AuthModule,
    HealthModule,
    MenuModule,
    RoleModule,
    UserModule,
    PrismaModule,
  ],
})
export class AppModule {}
