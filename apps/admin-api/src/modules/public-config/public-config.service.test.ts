import 'reflect-metadata';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from '@rstest/core';

import { PrismaService } from '../../prisma/prisma.service';
import { PublicConfigService } from './public-config.service';

describe('PublicConfigService', () => {
  it('拒绝保存空配置值', async () => {
    const service = new PublicConfigService({} as PrismaService);

    await expect(service.createConfig({ key: 'site.name', value: '  ' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('拒绝删除不存在的公共配置', async () => {
    const prisma = {
      publicConfig: { findUnique: async () => null },
    } as unknown as PrismaService;
    const service = new PublicConfigService(prisma);

    await expect(service.deleteConfig(1)).rejects.toBeInstanceOf(NotFoundException);
  });
});
