import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { CanActivate, ExecutionContext } from '@nestjs/common';

import type { PermissionCode } from '@repo/shared/types';

import { REQUIRED_PERMISSIONS_METADATA_KEY } from '../decorators/require-permissions.decorator';
import type { AdminRequest } from '../../types';

/**
 * 管理端接口级 RBAC 权限守卫
 *
 * 读取 `RequirePermissions` 写入的权限元数据，并与 `AdminJwtGuard` 挂载的数据库最新权限集合比较。
 * 内置 `super_admin` 角色直接通过授权，确保新增权限或误删关联后仍具备系统恢复能力。未声明权限的
 * 接口只保留身份认证；普通角色面对多个权限要求时必须全部满足。
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  /**
   * 判断当前管理员是否拥有接口要求的全部权限
   *
   * @param context NestJS 当前 HTTP 请求执行上下文
   * @returns 未声明权限或全部权限匹配时返回 `true`
   * @throws 缺少任一权限时抛出 403
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionCode[]>(REQUIRED_PERMISSIONS_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AdminRequest>();
    const isSuperAdmin = request.admin?.roles.some((role) => role.code === 'super_admin') ?? false;
    if (isSuperAdmin) {
      return true;
    }

    const grantedPermissions = new Set(request.admin?.permissions ?? []);
    const isAllowed = requiredPermissions.every((permission) => grantedPermissions.has(permission));

    if (!isAllowed) {
      throw new ForbiddenException('没有执行此操作的权限');
    }

    return true;
  }
}
