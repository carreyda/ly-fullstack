import 'reflect-metadata';

import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from '@rstest/core';

import { PrismaService } from '../../prisma/prisma.service';
import { PublicDictionaryService } from './public-dictionary.service';

describe('PublicDictionaryService', () => {
  it('只返回服务查询得到的公开字段', async () => {
    const prisma = {
      dictionary: {
        findFirst: async () => ({
          code: 'user_gender',
          name: '用户性别',
          items: [{ label: '男', value: 'male' }],
        }),
      },
    } as unknown as PrismaService;
    const service = new PublicDictionaryService(prisma);

    const result = await service.getDictionary('USER_GENDER');

    expect(result).toEqual({
      code: 'user_gender',
      name: '用户性别',
      items: [{ label: '男', value: 'male' }],
    });
  });

  it('停用或不存在的字典返回 404', async () => {
    const prisma = {
      dictionary: { findFirst: async () => null },
    } as unknown as PrismaService;
    const service = new PublicDictionaryService(prisma);

    await expect(service.getDictionary('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
