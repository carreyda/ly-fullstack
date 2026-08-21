import 'reflect-metadata';

import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from '@rstest/core';

import { PrismaService } from '../../prisma/prisma.service';
import { RoleService } from './role.service';

/**
 * 创建角色管理测试使用的数据库记录
 *
 * @param overrides 当前用例需要覆盖的字段
 * @returns 字段完整的角色记录
 */
const createRoleRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 2,
  name: '运营管理员',
  code: 'operator',
  description: '负责日常运营',
  isActive: true,
  createdAt: new Date('2026-08-21T08:00:00.000Z'),
  updatedAt: new Date('2026-08-21T08:00:00.000Z'),
  _count: {
    users: 2,
    menus: 6,
  },
  ...overrides,
});

describe('RoleService', () => {
  it('按分页契约返回角色列表和关联数量', async () => {
    const records = [createRoleRecord()];
    const prisma = {
      role: {
        count: async () => 1,
        findMany: async () => records,
      },
      $transaction: async (operations: Promise<unknown>[]) => Promise.all(operations),
    } as unknown as PrismaService;
    const service = new RoleService(prisma);

    const result = await service.getRoles({ pageNum: 1, pageSize: 20 });

    expect(result.total).toBe(1);
    expect(result.list[0]).toMatchObject({
      name: '运营管理员',
      userCount: 2,
      menuCount: 6,
      isSystem: false,
    });
  });

  it('拒绝删除系统内置超级管理员角色', async () => {
    const prisma = {
      role: {
        findUnique: async () => ({ code: 'super_admin', _count: { users: 1 } }),
      },
    } as unknown as PrismaService;
    const service = new RoleService(prisma);

    await expect(service.deleteRole(1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('拒绝删除仍然绑定用户的普通角色', async () => {
    const prisma = {
      role: {
        findUnique: async () => ({ code: 'operator', _count: { users: 1 } }),
      },
    } as unknown as PrismaService;
    const service = new RoleService(prisma);

    await expect(service.deleteRole(2)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('分配菜单权限时自动补齐完整父级链路', async () => {
    let createdRelations: Array<{ roleId: number; menuId: number }> = [];
    const transactionClient = {
      roleMenu: {
        deleteMany: async () => ({ count: 0 }),
        createMany: async ({ data }: { data: Array<{ roleId: number; menuId: number }> }) => {
          createdRelations = data;
          return { count: data.length };
        },
      },
    };
    const prisma = {
      role: {
        findUnique: async () => ({ id: 2, code: 'operator' }),
      },
      menu: {
        findMany: async () => [
          { id: 1, parentId: null, isActive: true },
          { id: 2, parentId: 1, isActive: true },
          { id: 3, parentId: 2, isActive: true },
        ],
      },
      $transaction: async (callback: (client: typeof transactionClient) => Promise<void>) =>
        callback(transactionClient),
    } as unknown as PrismaService;
    const service = new RoleService(prisma);

    await service.assignRoleMenus(2, { menuIds: [3] });

    expect(createdRelations).toHaveLength(3);
    expect(createdRelations.map((relation) => relation.menuId).sort()).toEqual([1, 2, 3]);
  });
});
