import type { AdminCaptchaResponse } from '@repo/shared/types';

/**
 * 图片滑块的服务端校验状态
 */
export type SlideVerifyResultState = 'default' | 'verifying' | 'success' | 'fail';

/**
 * 图片滑块组合式函数参数
 */
export interface UseSlideVerifyOptions {
  /**
   * 读取当前服务端挑战
   */
  getChallenge: () => AdminCaptchaResponse;

  /**
   * 读取当前服务端校验状态
   */
  getResultState: () => SlideVerifyResultState;

  /**
   * 读取图片或挑战是否仍在加载
   */
  isLoading: () => boolean;

  /**
   * 拖动完成后向上层提交实际偏移量
   */
  onVerify: (offset: number) => void;
}
