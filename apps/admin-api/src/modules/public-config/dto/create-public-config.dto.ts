import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * 新增公共配置 DTO
 */
export class CreatePublicConfigDto {
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z][a-z0-9_.-]*$/)
  key!: string;

  @IsString()
  @MaxLength(2000)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string | null;
}
