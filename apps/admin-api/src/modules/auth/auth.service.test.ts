import 'reflect-metadata';

import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from '@rstest/core';
import { compare, hash } from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { RbacAccessService } from '../rbac/rbac-access.service';
import { AuthService } from './auth.service';

/**
 * 创建修改密码测试使用的认证服务
 *
 * 登录签名和 RBAC 查询不参与当前测试，使用空实现满足构造依赖；Prisma 只实现密码查询和更新协议。
 *
 * @param passwordHash 数据库当前保存的密码哈希
 * @param onUpdate 捕获服务写入的新密码哈希
 * @returns 可执行修改密码逻辑的认证服务
 */
const createAuthService = (passwordHash: string, onUpdate: (nextPasswordHash: string) => void): AuthService => {
  const prisma = {
    user: {
      findUnique: async () => ({ passwordHash }),
      update: async (params: { data: { passwordHash: string } }) => {
        onUpdate(params.data.passwordHash);
        return {};
      },
    },
  } as unknown as PrismaService;

  return new AuthService(prisma, {} as JwtService, {} as RbacAccessService);
};

describe('AuthService', () => {
  it('校验当前密码后保存新密码哈希', async () => {
    const currentPasswordHash = await hash('admin123', 4);
    let updatedPasswordHash = '';
    const service = createAuthService(currentPasswordHash, (nextPasswordHash) => {
      updatedPasswordHash = nextPasswordHash;
    });

    await service.changePassword(1, {
      currentPassword: 'admin123',
      newPassword: 'newAdmin123',
    });

    expect(updatedPasswordHash).not.toBe('newAdmin123');
    await expect(compare('newAdmin123', updatedPasswordHash)).resolves.toBe(true);
  });

  it('当前密码错误时拒绝覆盖密码哈希', async () => {
    const currentPasswordHash = await hash('admin123', 4);
    let updateCalled = false;
    const service = createAuthService(currentPasswordHash, () => {
      updateCalled = true;
    });

    await expect(
      service.changePassword(1, {
        currentPassword: 'incorrect-password',
        newPassword: 'newAdmin123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(updateCalled).toBe(false);
  });

  it('新密码与当前密码相同时拒绝无效修改', async () => {
    const currentPasswordHash = await hash('admin123', 4);
    const service = createAuthService(currentPasswordHash, () => undefined);

    await expect(
      service.changePassword(1, {
        currentPassword: 'admin123',
        newPassword: 'admin123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
