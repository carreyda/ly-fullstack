import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';

import type { AdminDictionaryItemListItem, AdminDictionaryListItem, PaginationResult } from '@repo/shared/types';

import { PrismaService } from '../../prisma/prisma.service';
import type { AdminDictionaryItemRecord, AdminDictionaryRecord } from '../../types';
import type { CreateDictionaryDto } from './dto/create-dictionary.dto';
import type { CreateDictionaryItemDto } from './dto/create-dictionary-item.dto';
import type { DictionaryItemQueryDto } from './dto/dictionary-item-query.dto';
import type { DictionaryQueryDto } from './dto/dictionary-query.dto';
import type { UpdateDictionaryDto } from './dto/update-dictionary.dto';
import type { UpdateDictionaryItemDto } from './dto/update-dictionary-item.dto';

const DICTIONARY_SELECT = {
  id: true,
  code: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { items: true } },
} as const;

const DICTIONARY_ITEM_SELECT = {
  id: true,
  dictionaryId: true,
  label: true,
  value: true,
  description: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * 把可选文本归一化为数据库可空字段
 *
 * @param value 表单提交的可选文本
 * @returns 去除两侧空白后的文本；空字符串返回 `null`
 */
const normalizeOptionalText = (value: string | null | undefined): string | null => value?.trim() || null;

/**
 * 字典和字典项管理业务服务
 */
@Injectable()
export class DictionaryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * 分页查询字典
   *
   * @param query 分页与筛选参数
   * @returns 字典分页结果
   */
  async getDictionaries(query: DictionaryQueryDto): Promise<PaginationResult<AdminDictionaryListItem>> {
    const keyword = query.keyword?.trim();
    const where: Prisma.DictionaryWhereInput = {
      isActive: query.status ? query.status === 'ACTIVE' : undefined,
      OR: keyword
        ? [{ name: { contains: keyword, mode: 'insensitive' } }, { code: { contains: keyword, mode: 'insensitive' } }]
        : undefined,
    };
    const [total, records] = await this.prisma.$transaction([
      this.prisma.dictionary.count({ where }),
      this.prisma.dictionary.findMany({
        where,
        select: DICTIONARY_SELECT,
        orderBy: [{ id: 'desc' }],
        skip: (query.pageNum - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      list: records.map((record) => this.mapDictionary(record)),
      total,
      pageNum: query.pageNum,
      pageSize: query.pageSize,
    };
  }

  /**
   * 新增字典
   *
   * @param dto 字典表单
   * @returns 新增后的字典
   */
  async createDictionary(dto: CreateDictionaryDto): Promise<AdminDictionaryListItem> {
    const code = dto.code.trim().toLowerCase();
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('字典名称不能为空');
    }

    try {
      const record = await this.prisma.dictionary.create({
        data: {
          code,
          name,
          description: normalizeOptionalText(dto.description),
          isActive: dto.isActive ?? true,
        },
        select: DICTIONARY_SELECT,
      });
      return this.mapDictionary(record);
    } catch (error) {
      this.rethrowDictionaryConflict(error);
    }
  }

  /**
   * 编辑字典基础信息
   *
   * @param id 字典主键
   * @param dto 字典表单
   * @returns 更新后的字典
   */
  async updateDictionary(id: number, dto: UpdateDictionaryDto): Promise<AdminDictionaryListItem> {
    await this.assertDictionaryExists(id);
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('字典名称不能为空');
    }

    const record = await this.prisma.dictionary.update({
      where: { id },
      data: {
        name,
        description: normalizeOptionalText(dto.description),
        isActive: dto.isActive,
      },
      select: DICTIONARY_SELECT,
    });
    return this.mapDictionary(record);
  }

  /**
   * 删除没有字典项的字典
   *
   * @param id 字典主键
   */
  async deleteDictionary(id: number): Promise<void> {
    const dictionary = await this.prisma.dictionary.findUnique({
      where: { id },
      select: { _count: { select: { items: true } } },
    });
    if (!dictionary) {
      throw new NotFoundException('字典不存在');
    }
    if (dictionary._count.items > 0) {
      throw new BadRequestException('该字典仍包含字典项，请先清空字典项');
    }

    await this.prisma.dictionary.delete({ where: { id } });
  }

  /**
   * 分页查询指定字典的字典项
   *
   * @param dictionaryId 字典主键
   * @param query 分页与筛选参数
   * @returns 字典项分页结果
   */
  async getDictionaryItems(
    dictionaryId: number,
    query: DictionaryItemQueryDto,
  ): Promise<PaginationResult<AdminDictionaryItemListItem>> {
    await this.assertDictionaryExists(dictionaryId);
    const keyword = query.keyword?.trim();
    const where: Prisma.DictionaryItemWhereInput = {
      dictionaryId,
      isActive: query.status ? query.status === 'ACTIVE' : undefined,
      OR: keyword
        ? [{ label: { contains: keyword, mode: 'insensitive' } }, { value: { contains: keyword, mode: 'insensitive' } }]
        : undefined,
    };
    const [total, records] = await this.prisma.$transaction([
      this.prisma.dictionaryItem.count({ where }),
      this.prisma.dictionaryItem.findMany({
        where,
        select: DICTIONARY_ITEM_SELECT,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        skip: (query.pageNum - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      list: records.map((record) => this.mapDictionaryItem(record)),
      total,
      pageNum: query.pageNum,
      pageSize: query.pageSize,
    };
  }

  /**
   * 新增字典项
   *
   * @param dictionaryId 字典主键
   * @param dto 字典项表单
   * @returns 新增后的字典项
   */
  async createDictionaryItem(dictionaryId: number, dto: CreateDictionaryItemDto): Promise<AdminDictionaryItemListItem> {
    await this.assertDictionaryExists(dictionaryId);
    const label = dto.label.trim();
    const value = dto.value.trim();
    this.assertDictionaryItemRequiredFields(label, value);
    try {
      const record = await this.prisma.dictionaryItem.create({
        data: {
          dictionaryId,
          label,
          value,
          description: normalizeOptionalText(dto.description),
          sortOrder: dto.sortOrder ?? 0,
          isActive: dto.isActive ?? true,
        },
        select: DICTIONARY_ITEM_SELECT,
      });
      return this.mapDictionaryItem(record);
    } catch (error) {
      this.rethrowDictionaryItemConflict(error);
    }
  }

  /**
   * 编辑字典项
   *
   * @param dictionaryId 字典主键
   * @param itemId 字典项主键
   * @param dto 字典项表单
   * @returns 更新后的字典项
   */
  async updateDictionaryItem(
    dictionaryId: number,
    itemId: number,
    dto: UpdateDictionaryItemDto,
  ): Promise<AdminDictionaryItemListItem> {
    await this.assertDictionaryItemExists(dictionaryId, itemId);
    const label = dto.label.trim();
    const value = dto.value.trim();
    this.assertDictionaryItemRequiredFields(label, value);
    try {
      const record = await this.prisma.dictionaryItem.update({
        where: { id: itemId },
        data: {
          label,
          value,
          description: normalizeOptionalText(dto.description),
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
        select: DICTIONARY_ITEM_SELECT,
      });
      return this.mapDictionaryItem(record);
    } catch (error) {
      this.rethrowDictionaryItemConflict(error);
    }
  }

  /**
   * 删除字典项
   *
   * @param dictionaryId 字典主键
   * @param itemId 字典项主键
   */
  async deleteDictionaryItem(dictionaryId: number, itemId: number): Promise<void> {
    await this.assertDictionaryItemExists(dictionaryId, itemId);
    await this.prisma.dictionaryItem.delete({ where: { id: itemId } });
  }

  private async assertDictionaryExists(id: number): Promise<void> {
    const dictionary = await this.prisma.dictionary.findUnique({ where: { id }, select: { id: true } });
    if (!dictionary) {
      throw new NotFoundException('字典不存在');
    }
  }

  private async assertDictionaryItemExists(dictionaryId: number, itemId: number): Promise<void> {
    const item = await this.prisma.dictionaryItem.findFirst({
      where: { id: itemId, dictionaryId },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException('字典项不存在');
    }
  }

  /**
   * 校验字典项展示文本和字典值不是空白字符串
   *
   * @param label 归一化后的展示文本
   * @param value 归一化后的字典值
   */
  private assertDictionaryItemRequiredFields(label: string, value: string): void {
    if (!label || !value) {
      throw new BadRequestException('字典项展示文本和字典值不能为空');
    }
  }

  private rethrowDictionaryConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('字典编码已存在');
    }
    throw error;
  }

  private rethrowDictionaryItemConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('当前字典下的字典值已存在');
    }
    throw error;
  }

  private mapDictionary(record: AdminDictionaryRecord): AdminDictionaryListItem {
    return {
      id: record.id,
      code: record.code,
      name: record.name,
      description: record.description,
      isActive: record.isActive,
      itemCount: record._count.items,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private mapDictionaryItem(record: AdminDictionaryItemRecord): AdminDictionaryItemListItem {
    return {
      ...record,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
