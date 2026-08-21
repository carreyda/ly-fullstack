import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * 编辑角色 DTO
 *
 * 角色编码不进入编辑契约，避免已经用于权限逻辑的稳定标识被修改。
 */
export class UpdateRoleDto {
  /**
   * 角色展示名称
   */
  @IsString()
  @MaxLength(50)
  name!: string;

  /**
   * 角色职责说明
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string | null;

  /**
   * 是否参与会话授权
   */
  @IsBoolean()
  isActive!: boolean;
}
