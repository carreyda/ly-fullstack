import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * 新增角色 DTO
 *
 * DTO 只校验字段结构与长度，名称和编码唯一性、系统角色保护等领域约束由角色 Service 负责。
 */
export class CreateRoleDto {
  /**
   * 角色展示名称
   */
  @IsString()
  @MaxLength(50)
  name!: string;

  /**
   * 创建后不可修改的小写角色编码
   */
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_]*$/)
  code!: string;

  /**
   * 角色职责说明
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string | null;

  /**
   * 是否立即启用角色
   */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
