import { createParamDecorator } from '@nestjs/common';

import type { ExecutionContext } from '@nestjs/common';

import type { AdminRequest, AuthenticatedAdmin } from '../../types';

/**
 * 从已通过认证守卫的 Fastify 请求中读取当前管理员
 *
 * 该装饰器只能用于已经声明 `AdminJwtGuard` 的 Controller 方法。若调用顺序配置错误，直接抛出
 * 开发期异常，而不是把缺失的管理员伪装成可空业务数据。
 */
export const CurrentAdmin = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedAdmin => {
  const request = context.switchToHttp().getRequest<AdminRequest>();

  if (!request.admin) {
    throw new Error('CurrentAdmin 必须在 AdminJwtGuard 之后使用。');
  }

  return request.admin;
});
