import type { Ref } from 'vue';

/**
 * 登录滑块验证 Composable 的受控状态参数
 */
export interface UseSlideVerifyOptions {
  /**
   * 登录页持有的双向验证状态
   */
  verified: Ref<boolean>;

  /**
   * 获取登录提交期间的禁用状态
   */
  getDisabled: () => boolean;
}
