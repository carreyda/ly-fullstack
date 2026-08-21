import 'reflect-metadata';

import { describe, expect, it } from '@rstest/core';
import { MenuType } from '@repo/database';

import { PrismaService } from '../../prisma/prisma.service';
import { RbacAccessService } from './rbac-access.service';

const createPrisma = (user: unknown): PrismaService => {
  return {
    user: {
      findUnique: async () => user,
    },
  } as unknown as PrismaService;
};

describe('RbacAccessService', () => {
  it('合并多角色菜单、去重权限并生成有序导航树', async () => {
    const systemMenu = {
      id: 1,
      parentId: null,
      name: '系统管理',
      type: MenuType.DIRECTORY,
      routePath: '/system',
      routeName: 'system',
      component: null,
      icon: 'Settings',
      permissionCode: null,
      sortOrder: 10,
      isVisible: true,
    };
    const userMenu = {
      id: 2,
      parentId: 1,
      name: '用户管理',
      type: MenuType.MENU,
      routePath: '/system/user',
      routeName: 'system-user',
      component: 'system/user/index',
      icon: null,
      permissionCode: null,
      sortOrder: 1,
      isVisible: true,
    };
    const listPermission = {
      id: 3,
      parentId: 2,
      name: '查询用户',
      type: MenuType.BUTTON,
      routePath: null,
      routeName: null,
      component: null,
      icon: null,
      permissionCode: 'system:user:list',
      sortOrder: 1,
      isVisible: false,
    };
    const prisma = createPrisma({
      id: 7,
      username: 'admin',
      displayName: '管理员',
      isActive: true,
      roles: [
        {
          role: {
            id: 1,
            name: '超级管理员',
            code: 'super_admin',
            menus: [systemMenu, userMenu, listPermission].map((menu) => ({ menu })),
          },
        },
        {
          role: {
            id: 2,
            name: '用户管理员',
            code: 'user_admin',
            menus: [userMenu, listPermission].map((menu) => ({ menu })),
          },
        },
      ],
    });
    const service = new RbacAccessService(prisma);

    const result = await service.getActiveAdmin(7);

    expect(result?.permissions).toEqual(['system:user:list']);
    expect(result?.roles).toHaveLength(2);
    expect(result?.menus).toHaveLength(1);
    expect(result?.menus[0]?.name).toBe('系统管理');
    expect(result?.menus[0]?.children[0]?.name).toBe('用户管理');
    expect(result?.menus[0]?.children[0]?.children).toEqual([]);
  });

  it('账号禁用时不返回访问快照', async () => {
    const service = new RbacAccessService(
      createPrisma({
        id: 7,
        username: 'admin',
        displayName: '管理员',
        isActive: false,
        roles: [],
      }),
    );

    await expect(service.getActiveAdmin(7)).resolves.toBeNull();
  });
});
