import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * 管理员重置用户密码 DTO
 */
export class ResetUserPasswordDto {
  /**
   * 重新生成哈希并覆盖旧密码的新密码
   */
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;
}
