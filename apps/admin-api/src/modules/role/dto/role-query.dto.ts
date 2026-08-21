import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import type { AdminRoleStatusFilter } from '@repo/shared/types';

import { ADMIN_PAGE_SIZE_OPTIONS } from '../../../constants';

/**
 * 角色列表分页筛选 DTO
 */
export class RoleQueryDto {
  /**
   * 当前页码，从 1 开始
   */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNum!: number;

  /**
   * 每页记录数，只允许后台统一档位
   */
  @Type(() => Number)
  @IsInt()
  @IsIn(ADMIN_PAGE_SIZE_OPTIONS)
  pageSize!: number;

  /**
   * 同时匹配角色名称和编码的搜索词
   */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  keyword?: string;

  /**
   * 角色启用状态
   */
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: AdminRoleStatusFilter;
}
