import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { PublicDictionary } from '@repo/shared/types';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * 面向 C 端的公共字典读取服务
 */
@Injectable()
export class PublicDictionaryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * 按稳定编码读取启用字典及启用字典项
   *
   * @param code 字典稳定编码
   * @returns 可直接供 C 端渲染的字典数据
   */
  async getDictionary(code: string): Promise<PublicDictionary> {
    const dictionary = await this.prisma.dictionary.findFirst({
      where: { code: code.trim().toLowerCase(), isActive: true },
      select: {
        code: true,
        name: true,
        items: {
          where: { isActive: true },
          select: { label: true, value: true },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        },
      },
    });
    if (!dictionary) {
      throw new NotFoundException('字典不存在或已停用');
    }
    return dictionary;
  }
}
