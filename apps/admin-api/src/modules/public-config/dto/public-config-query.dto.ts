import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import { ADMIN_PAGE_SIZE_OPTIONS } from '../../../constants';

/**
 * 公共配置列表分页筛选 DTO
 */
export class PublicConfigQueryDto {
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
  @MaxLength(100)
  keyword?: string;
}
