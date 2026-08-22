import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import type { AdminUserStatusFilter } from '@repo/shared/types';

import { ADMIN_PAGE_SIZE_OPTIONS } from '../../../constants';

/**
 * 用户列表分页筛选 DTO
 */
export class UserQueryDto {
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
   * 同时匹配登录名和显示名称的搜索词
   */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  keyword?: string;

  /**
   * 用户启用状态
   */
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: AdminUserStatusFilter;

  /**
   * 只查询绑定指定角色的用户
   */
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  roleId?: number;
}
