import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * 编辑字典项 DTO
 */
export class UpdateDictionaryItemDto {
  @IsString()
  @MaxLength(50)
  label!: string;

  @IsString()
  @MaxLength(100)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number;

  @IsBoolean()
  isActive!: boolean;
}
