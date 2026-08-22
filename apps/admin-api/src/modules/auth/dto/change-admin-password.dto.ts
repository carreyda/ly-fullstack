import { IsString, Length } from 'class-validator';

import type { ChangeAdminPasswordParams } from '@repo/shared/types';

/**
 * 当前管理员修改本人密码 DTO
 *
 * DTO 只校验请求字段和 bcrypt 支持的长度边界。当前密码是否正确、新密码是否重复由 `AuthService`
 * 根据数据库中的密码哈希判断，明文密码不得写入日志或持久化。
 */
export class ChangeAdminPasswordDto implements ChangeAdminPasswordParams {
  /**
   * 当前登录密码，用于再次确认操作者身份
   */
  @IsString()
  @Length(8, 72)
  currentPassword!: string;

  /**
   * 需要替换的新密码
   */
  @IsString()
  @Length(8, 72)
  newPassword!: string;
}
