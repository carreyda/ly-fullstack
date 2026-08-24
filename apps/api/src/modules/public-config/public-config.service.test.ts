import 'reflect-metadata';

import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from '@rstest/core';

import { PrismaService } from '../../prisma/prisma.service';
import { PublicConfigService } from './public-config.service';

describe('PublicConfigService', () => {
  it('按键返回最小公开配置契约', async () => {
    const prisma = {
      publicConfig: {
        findUnique: async () => ({ key: 'site.name', value: 'LY Fullstack' }),
      },
    } as unknown as PrismaService;
    const service = new PublicConfigService(prisma);

    await expect(service.getConfig('SITE.NAME')).resolves.toEqual({
      key: 'site.name',
      value: 'LY Fullstack',
    });
  });

  it('不存在的配置返回 404', async () => {
    const prisma = {
      publicConfig: { findUnique: async () => null },
    } as unknown as PrismaService;
    const service = new PublicConfigService(prisma);

    await expect(service.getConfig('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
