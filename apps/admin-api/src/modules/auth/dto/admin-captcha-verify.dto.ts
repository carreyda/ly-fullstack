import { IsInt, IsUUID, Max, Min } from 'class-validator';

import type { AdminCaptchaVerifyParams } from '@repo/shared/types';

/**
 * 管理端图片滑块校验 DTO
 *
 * DTO 只限制挑战编号和像素偏移的输入边界，挑战是否存在、过期和位置匹配由
 * `AuthCaptchaService` 判断。
 */
export class AdminCaptchaVerifyDto implements AdminCaptchaVerifyParams {
  /**
   * Admin API 签发的一次性挑战编号
   */
  @IsUUID()
  captchaId!: string;

  /**
   * 用户完成拼图时的横向偏移量
   */
  @IsInt()
  @Min(0)
  @Max(310)
  offset!: number;
}
