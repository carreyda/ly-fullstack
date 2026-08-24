import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';

import type { AdminPublicConfigListItem, PaginationResult } from '@repo/shared/types';

import { PrismaService } from '../../prisma/prisma.service';
import type { AdminPublicConfigRecord } from '../../types';
import type { CreatePublicConfigDto } from './dto/create-public-config.dto';
import type { PublicConfigQueryDto } from './dto/public-config-query.dto';
import type { UpdatePublicConfigDto } from './dto/update-public-config.dto';

const PUBLIC_CONFIG_SELECT = {
  id: true,
  key: true,
  value: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * 公共配置管理业务服务
 *
 * 该模块中的全部值都会被默认公共 API 按键读取，禁止写入密码、密钥、令牌和内部连接信息。
 */
@Injectable()
export class PublicConfigService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getConfigs(query: PublicConfigQueryDto): Promise<PaginationResult<AdminPublicConfigListItem>> {
    const keyword = query.keyword?.trim();
    const where: Prisma.PublicConfigWhereInput = keyword
      ? {
          OR: [
            { key: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : {};
    const [total, records] = await this.prisma.$transaction([
      this.prisma.publicConfig.count({ where }),
      this.prisma.publicConfig.findMany({
        where,
        select: PUBLIC_CONFIG_SELECT,
        orderBy: [{ id: 'desc' }],
        skip: (query.pageNum - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      list: records.map((record) => this.mapConfig(record)),
      total,
      pageNum: query.pageNum,
      pageSize: query.pageSize,
    };
  }

  async createConfig(dto: CreatePublicConfigDto): Promise<AdminPublicConfigListItem> {
    const key = dto.key.trim().toLowerCase();
    const value = dto.value.trim();
    if (!value) {
      throw new BadRequestException('配置值不能为空');
    }

    try {
      const record = await this.prisma.publicConfig.create({
        data: { key, value, description: dto.description?.trim() || null },
        select: PUBLIC_CONFIG_SELECT,
      });
      return this.mapConfig(record);
    } catch (error) {
      this.rethrowUniqueConflict(error);
    }
  }

  async updateConfig(id: number, dto: UpdatePublicConfigDto): Promise<AdminPublicConfigListItem> {
    await this.assertConfigExists(id);
    const value = dto.value.trim();
    if (!value) {
      throw new BadRequestException('配置值不能为空');
    }
    const record = await this.prisma.publicConfig.update({
      where: { id },
      data: { value, description: dto.description?.trim() || null },
      select: PUBLIC_CONFIG_SELECT,
    });
    return this.mapConfig(record);
  }

  async deleteConfig(id: number): Promise<void> {
    await this.assertConfigExists(id);
    await this.prisma.publicConfig.delete({ where: { id } });
  }

  private async assertConfigExists(id: number): Promise<void> {
    const config = await this.prisma.publicConfig.findUnique({ where: { id }, select: { id: true } });
    if (!config) {
      throw new NotFoundException('公共配置不存在');
    }
  }

  private rethrowUniqueConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('配置键已存在');
    }
    throw error;
  }

  private mapConfig(record: AdminPublicConfigRecord): AdminPublicConfigListItem {
    return {
      ...record,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
