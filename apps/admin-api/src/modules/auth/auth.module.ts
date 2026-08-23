import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';

import { AdminJwtGuard, PermissionGuard } from '../../common';
import {
  ADMIN_LOGIN_RATE_BLOCK_MS,
  ADMIN_LOGIN_RATE_LIMIT,
  ADMIN_LOGIN_RATE_TTL_MS,
  ADMIN_LOGIN_THROTTLER_NAME,
} from '../../constants';
import { PrismaModule } from '../../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * 生成管理端登录接口的限流追踪标识
 *
 * 同一来源 IP 与同一登录名共享计数，既避免把一个办公网络中的全部管理员一起锁死，也能阻止脚本
 * 对固定账号进行高频密码尝试。反向代理部署必须传递真实客户端 IP，应用只信任本机代理。
 *
 * @param request Fastify 交给限流器的原始请求对象
 * @returns 归一化后的来源 IP 与登录名组合
 */
const resolveAdminLoginTracker = async (request: unknown): Promise<string> => {
  const requestRecord = request && typeof request === 'object' ? (request as Record<string, unknown>) : {};
  const body = requestRecord.body && typeof requestRecord.body === 'object' ? requestRecord.body : {};
  const bodyRecord = body as Record<string, unknown>;
  const ip = typeof requestRecord.ip === 'string' ? requestRecord.ip : 'unknown';
  const username = typeof bodyRecord.username === 'string' ? bodyRecord.username.trim().toLowerCase() : 'unknown';

  return `${ip}:${username || 'unknown'}`;
};

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
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: ADMIN_LOGIN_THROTTLER_NAME,
          ttl: ADMIN_LOGIN_RATE_TTL_MS,
          limit: ADMIN_LOGIN_RATE_LIMIT,
          blockDuration: ADMIN_LOGIN_RATE_BLOCK_MS,
        },
      ],
      getTracker: resolveAdminLoginTracker,
      errorMessage: '登录请求过于频繁，请稍后再试',
    }),
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
