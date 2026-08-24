import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * 编辑字典 DTO
 */
export class UpdateDictionaryDto {
  @IsString()
  @MaxLength(50)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string | null;

  @IsBoolean()
  isActive!: boolean;
}
