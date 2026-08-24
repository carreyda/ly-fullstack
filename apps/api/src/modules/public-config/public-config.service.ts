import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { PublicConfigValue } from '@repo/shared/types';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * 面向 C 端的公共配置读取服务
 *
 * 公共配置表中的值默认可被未登录用户按键读取，禁止存放任何密码、令牌和服务端密钥。
 */
@Injectable()
export class PublicConfigService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getConfig(key: string): Promise<PublicConfigValue> {
    const config = await this.prisma.publicConfig.findUnique({
      where: { key: key.trim().toLowerCase() },
      select: { key: true, value: true },
    });
    if (!config) {
      throw new NotFoundException('公共配置不存在');
    }
    return config;
  }
}
