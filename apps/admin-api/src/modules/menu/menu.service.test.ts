import 'reflect-metadata';

import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from '@rstest/core';
import { MenuType } from '@repo/database';

import { PrismaService } from '../../prisma/prisma.service';
import { MenuService } from './menu.service';

/**
 * 创建菜单管理测试使用的基础数据库记录
 *
 * @param overrides 当前用例需要覆盖的字段
 * @returns 字段完整的菜单记录
 */
const createMenuRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  parentId: null,
  name: '系统管理',
  type: MenuType.DIRECTORY,
  routePath: '/system',
  routeName: 'system',
  component: null,
  icon: 'Settings',
  permissionCode: null,
  sortOrder: 0,
  isVisible: true,
  isActive: true,
  ...overrides,
});

describe('MenuService', () => {
  it('把目录、页面和按钮记录构建为完整管理树', async () => {
    const records = [
      createMenuRecord(),
      createMenuRecord({
        id: 2,
        parentId: 1,
        name: '菜单管理',
        type: MenuType.MENU,
        routePath: '/system/menu',
        routeName: 'system-menu',
        component: 'system/menu/index',
        icon: null,
      }),
      createMenuRecord({
        id: 3,
        parentId: 2,
        name: '查询',
        type: MenuType.BUTTON,
        routePath: null,
        routeName: null,
        component: null,
        icon: null,
        permissionCode: 'system:menu:list',
        isVisible: false,
      }),
    ];
    const prisma = {
      menu: {
        findMany: async () => records,
      },
    } as unknown as PrismaService;
    const service = new MenuService(prisma);

    const tree = await service.getMenuTree();

    expect(tree).toHaveLength(1);
    expect(tree[0]?.children[0]?.name).toBe('菜单管理');
    expect(tree[0]?.children[0]?.children[0]?.permissionCode).toBe('system:menu:list');
  });

  it('标准权限只创建当前页面尚未拥有的节点', async () => {
    let createdData: unknown[] = [];
    const prisma = {
      menu: {
        findUnique: async () =>
          createMenuRecord({
            id: 2,
            parentId: 1,
            name: '菜单管理',
            type: MenuType.MENU,
            routePath: '/system/menu',
            routeName: 'system-menu',
            component: 'system/menu/index',
            icon: null,
          }),
        findMany: async () => [{ parentId: 2, permissionCode: 'system:menu:list' }],
        aggregate: async () => ({ _max: { sortOrder: 3 } }),
        createMany: async ({ data }: { data: unknown[] }) => {
          createdData = data;
          return { count: data.length };
        },
      },
    } as unknown as PrismaService;
    const service = new MenuService(prisma);

    const result = await service.createStandardPermissions(2, { permissionPrefix: 'system:menu' });

    expect(result.createdCount).toBe(3);
    expect(createdData).toHaveLength(3);
  });

  it('拒绝把菜单拖动到自己的后代节点下', async () => {
    const prisma = {
      menu: {
        findMany: async () => [
          { id: 1, parentId: null, type: MenuType.DIRECTORY },
          { id: 2, parentId: 1, type: MenuType.MENU },
        ],
      },
    } as unknown as PrismaService;
    const service = new MenuService(prisma);

    await expect(
      service.reorderMenus({
        items: [
          { id: 1, parentId: 2, sortOrder: 0 },
          { id: 2, parentId: 1, sortOrder: 0 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
