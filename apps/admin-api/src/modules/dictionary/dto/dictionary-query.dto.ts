import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import type { AdminDictionaryStatusFilter } from '@repo/shared/types';

import { ADMIN_PAGE_SIZE_OPTIONS } from '../../../constants';

/**
 * 字典列表分页筛选 DTO
 */
export class DictionaryQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNum!: number;

  @Type(() => Number)
  @IsInt()
  @IsIn(ADMIN_PAGE_SIZE_OPTIONS)
  pageSize!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  keyword?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: AdminDictionaryStatusFilter;
}
