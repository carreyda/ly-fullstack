import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * 新增后台用户 DTO
 *
 * 登录名创建后不可修改，密码只在当前请求中以明文存在，Service 会立即写入 bcrypt 哈希。
 */
export class CreateUserDto {
  /**
   * 创建后不可修改的登录名
   */
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]{2,49}$/)
  username!: string;

  /**
   * 初始登录密码
   */
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;

  /**
   * 管理后台展示名称
   */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string | null;

  /**
   * 是否立即启用用户
   */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
