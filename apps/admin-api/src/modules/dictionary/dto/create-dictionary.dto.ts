import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * 新增字典 DTO
 */
export class CreateDictionaryDto {
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_]*$/)
  code!: string;

  @IsString()
  @MaxLength(50)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
