import { IsString, Length } from 'class-validator';

import type { AdminLoginParams } from '@repo/shared/types';

/**
 * 管理端账号密码登录 DTO
 *
 * 字段长度与数据库账号字段和 bcrypt 输入边界保持一致。DTO 只负责请求结构校验，账号状态、角色状态和
 * 密码哈希比较由认证 Service 完成。
 */
export class AdminLoginDto implements AdminLoginParams {
  /**
   * RBAC 用户表中的唯一管理员登录名
   */
  @IsString()
  @Length(3, 50)
  username!: string;

  /**
   * 只用于本次 bcrypt 比较的明文密码，不写入日志和数据库
   */
  @IsString()
  @Length(8, 72)
  password!: string;
}
