import 'reflect-metadata';

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from '@rstest/core';

import type { ExecutionContext } from '@nestjs/common';

import { RbacAccessService } from '../../modules/rbac/rbac-access.service';
import type { AdminJwtPayload, AdminRequest, AuthenticatedAdmin } from '../../types';
import { AdminJwtGuard } from './admin-jwt.guard';

/**
 * 创建 JWT Guard 测试所需的最小请求执行上下文
 *
 * @param request 测试请求对象，Guard 会从中读取 Authorization 并写入管理员上下文
 * @returns 只实现 HTTP 请求读取能力的 NestJS 执行上下文
 */
const createExecutionContext = (request: AdminRequest): ExecutionContext => {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
};

/**
 * 创建指定 Token 载荷和数据库账号快照对应的 JWT Guard
 *
 * @param payload 模拟验签后的 JWT 载荷
 * @param admin 模拟数据库返回的最新管理员访问上下文
 * @returns 可直接执行 `canActivate` 的 Guard
 */
const createGuard = (payload: AdminJwtPayload, admin: AuthenticatedAdmin | null): AdminJwtGuard => {
  const jwtService = {
    verifyAsync: async () => payload,
  } as unknown as JwtService;
  const configService = {
    getOrThrow: () => 'test-secret',
  } as unknown as ConfigService;
  const rbacAccessService = {
    getActiveAdmin: async () => admin,
  } as unknown as RbacAccessService;

  return new AdminJwtGuard(jwtService, configService, rbacAccessService);
};

const admin: AuthenticatedAdmin = {
  id: 1,
  username: 'admin',
  displayName: '管理员',
  roles: [{ id: 1, name: '超级管理员', code: 'super_admin' }],
  menus: [],
  permissions: [],
  tokenVersion: 2,
};

describe('AdminJwtGuard', () => {
  it('Token 会话版本与数据库一致时写入管理员上下文', async () => {
    const request: AdminRequest = { headers: { authorization: 'Bearer valid-token' } };
    const guard = createGuard({ sub: 1, username: 'admin', tokenVersion: 2 }, admin);

    await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(true);
    expect(request.admin).toEqual(admin);
  });

  it('Token 会话版本落后于数据库时拒绝旧会话', async () => {
    const request: AdminRequest = { headers: { authorization: 'Bearer revoked-token' } };
    const guard = createGuard({ sub: 1, username: 'admin', tokenVersion: 1 }, admin);

    await expect(guard.canActivate(createExecutionContext(request))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(request.admin).toBeUndefined();
  });
});
