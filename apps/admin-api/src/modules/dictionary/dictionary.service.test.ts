import 'reflect-metadata';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from '@rstest/core';

import { PrismaService } from '../../prisma/prisma.service';
import { DictionaryService } from './dictionary.service';

const createDictionaryRecord = () => ({
  id: 1,
  code: 'user_gender',
  name: '用户性别',
  description: null,
  isActive: true,
  createdAt: new Date('2026-08-24T00:00:00.000Z'),
  updatedAt: new Date('2026-08-24T00:00:00.000Z'),
  _count: { items: 2 },
});

describe('DictionaryService', () => {
  it('返回字典分页结果和字典项数量', async () => {
    const prisma = {
      dictionary: {
        count: async () => 1,
        findMany: async () => [createDictionaryRecord()],
      },
      $transaction: async (operations: Promise<unknown>[]) => Promise.all(operations),
    } as unknown as PrismaService;
    const service = new DictionaryService(prisma);

    const result = await service.getDictionaries({ pageNum: 1, pageSize: 20 });

    expect(result.total).toBe(1);
    expect(result.list[0]).toMatchObject({ code: 'user_gender', itemCount: 2 });
  });

  it('拒绝删除仍包含字典项的字典', async () => {
    const prisma = {
      dictionary: {
        findUnique: async () => ({ _count: { items: 1 } }),
      },
    } as unknown as PrismaService;
    const service = new DictionaryService(prisma);

    await expect(service.deleteDictionary(1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('拒绝编辑不属于目标字典的字典项', async () => {
    const prisma = {
      dictionaryItem: { findFirst: async () => null },
    } as unknown as PrismaService;
    const service = new DictionaryService(prisma);

    await expect(
      service.updateDictionaryItem(1, 2, {
        label: '男',
        value: 'male',
        sortOrder: 1,
        isActive: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('拒绝创建只有空白文本的字典项', async () => {
    const prisma = {
      dictionary: { findUnique: async () => ({ id: 1 }) },
    } as unknown as PrismaService;
    const service = new DictionaryService(prisma);

    await expect(service.createDictionaryItem(1, { label: ' ', value: 'male' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
