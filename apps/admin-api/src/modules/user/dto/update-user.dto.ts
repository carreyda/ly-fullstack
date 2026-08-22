import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * 编辑后台用户基础资料 DTO
 *
 * 登录名、密码和角色不进入基础编辑契约，分别保持稳定标识和独立权限边界。
 */
export class UpdateUserDto {
  /**
   * 管理后台展示名称
   */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string | null;

  /**
   * 是否允许用户继续登录
   */
  @IsBoolean()
  isActive!: boolean;
}
