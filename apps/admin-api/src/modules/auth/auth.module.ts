import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AdminJwtGuard, PermissionGuard } from '../../common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * 管理端 JWT 认证模块
 *
 * 从当前环境读取签名密钥和有效期，装配认证 Controller、Service、JWT Guard 与权限 Guard。
 * 模块导出 Guard 和 JwtModule，后续用户、角色、菜单业务模块可以复用同一套认证边界。
 */
@Module({
  imports: [
    PrismaModule,
    RbacModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminJwtGuard, PermissionGuard],
  exports: [JwtModule, AdminJwtGuard, PermissionGuard],
})
export class AuthModule {}
