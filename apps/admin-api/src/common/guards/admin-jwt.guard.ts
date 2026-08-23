import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { CanActivate, ExecutionContext } from '@nestjs/common';

import { RbacAccessService } from '../../modules/rbac/rbac-access.service';
import type { AdminJwtPayload, AdminRequest } from '../../types';

/**
 * 从 Authorization 请求头提取 Bearer Token
 *
 * @param authorization Fastify 请求中的原始 Authorization 头
 * @returns 去除 Bearer 前缀和两侧空白后的 Token；格式不符合约定时返回空字符串
 */
const resolveBearerToken = (authorization: string | undefined): string => {
  if (!authorization?.startsWith('Bearer ')) {
    return '';
  }

  return authorization.slice('Bearer '.length).trim();
};

/**
 * 管理端 JWT 身份认证守卫
 *
 * 先验证 Bearer Token 的签名和有效期，再按 Token 中的用户主键重新读取数据库状态。角色和权限
 * 不从 Token 读取，确保账号禁用、角色解绑和权限收回可以在下一次请求立即生效。Guard 还会比对
 * Token 与数据库中的会话版本，让修改密码和后台重置密码可以撤销此前签发的全部 Token。
 */
@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(RbacAccessService) private readonly rbacAccessService: RbacAccessService,
  ) {}

  /**
   * 校验当前请求并写入最新管理员访问上下文
   *
   * @param context NestJS 当前 HTTP 请求执行上下文
   * @returns 验证成功时返回 `true`
   * @throws 缺少 Token、验签失败或账号不可用时抛出 401
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const token = resolveBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('请先登录');
    }

    let payload: AdminJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<AdminJwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

    const admin = await this.rbacAccessService.getActiveAdmin(payload.sub);
    if (!admin) {
      throw new UnauthorizedException('账号不存在或已被禁用');
    }

    if (payload.tokenVersion !== admin.tokenVersion) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

    request.admin = admin;
    return true;
  }
}
