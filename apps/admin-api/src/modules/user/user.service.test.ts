import 'reflect-metadata';

import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from '@rstest/core';

import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from './user.service';

/**
 * 创建用户管理测试使用的数据库记录
 *
 * @param overrides 当前用例需要覆盖的字段
 * @returns 字段完整的用户记录
 */
const createUserRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 2,
  username: 'operator',
  displayName: '运营人员',
  isActive: true,
  createdAt: new Date('2026-08-21T08:00:00.000Z'),
  updatedAt: new Date('2026-08-21T08:00:00.000Z'),
  roles: [
    {
      role: {
        id: 2,
        name: '运营管理员',
        code: 'operator',
      },
    },
  ],
  ...overrides,
});

describe('UserService', () => {
  it('按分页契约返回用户和角色摘要', async () => {
    const records = [createUserRecord()];
    const prisma = {
      user: {
        count: async () => 1,
        findMany: async () => records,
      },
      $transaction: async (operations: Promise<unknown>[]) => Promise.all(operations),
    } as unknown as PrismaService;
    const service = new UserService(prisma);

    const result = await service.getUsers({ pageNum: 1, pageSize: 20 });

    expect(result.total).toBe(1);
    expect(result.list[0]).toMatchObject({
      username: 'operator',
      displayName: '运营人员',
      isSystem: false,
      roles: [{ code: 'operator' }],
    });
  });

  it('拒绝停用系统超级管理员账号', async () => {
    const prisma = {
      user: {
        findUnique: async () => ({
          id: 1,
          roles: [{ role: { code: 'super_admin' } }],
        }),
      },
    } as unknown as PrismaService;
    const service = new UserService(prisma);

    await expect(service.updateUser(1, { displayName: '管理员', isActive: false }, 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('拒绝删除系统超级管理员账号', async () => {
    const prisma = {
      user: {
        findUnique: async () => ({
          id: 1,
          roles: [{ role: { code: 'super_admin' } }],
        }),
      },
    } as unknown as PrismaService;
    const service = new UserService(prisma);

    await expect(service.deleteUser(1, 2)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('拒绝给普通用户分配停用角色', async () => {
    const prisma = {
      user: {
        findUnique: async () => ({ id: 2, roles: [] }),
      },
      role: {
        findMany: async () => [{ id: 3, code: 'disabled_role', isActive: false }],
      },
    } as unknown as PrismaService;
    const service = new UserService(prisma);

    await expect(service.assignUserRoles(2, { roleIds: [3] }, 1)).rejects.toBeInstanceOf(BadRequestException);
  });
});
