import 'reflect-metadata';

import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from '@rstest/core';

import type { ExecutionContext } from '@nestjs/common';
import type { PermissionCode } from '@repo/shared/types';

import type { AdminRequest } from '../../types';
import { PermissionGuard } from './permission.guard';

const createContext = (permissions: PermissionCode[]): ExecutionContext => {
  const request: AdminRequest = {
    headers: {},
    admin: {
      id: 1,
      username: 'admin',
      displayName: '管理员',
      roles: [],
      menus: [],
      permissions,
    },
  };

  return {
    getHandler: () => createContext,
    getClass: () => PermissionGuard,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
};

const createReflector = (permissions: PermissionCode[]): Reflector => {
  return {
    getAllAndOverride: () => permissions,
  } as unknown as Reflector;
};

describe('PermissionGuard', () => {
  it('同时拥有接口要求的全部权限时允许访问', () => {
    const permissions: PermissionCode[] = ['system:user:list', 'system:user:update'];
    const guard = new PermissionGuard(createReflector(permissions));

    expect(guard.canActivate(createContext(permissions))).toBe(true);
  });

  it('缺少任一权限时返回 403', () => {
    const guard = new PermissionGuard(createReflector(['system:user:list', 'system:user:update']));

    expect(() => guard.canActivate(createContext(['system:user:list']))).toThrow(ForbiddenException);
  });

  it('接口没有声明权限时只执行身份校验', () => {
    const guard = new PermissionGuard(createReflector([]));

    expect(guard.canActivate(createContext([]))).toBe(true);
  });
});
