import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * 编辑公共配置 DTO
 */
export class UpdatePublicConfigDto {
  @IsString()
  @MaxLength(2000)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string | null;
}
