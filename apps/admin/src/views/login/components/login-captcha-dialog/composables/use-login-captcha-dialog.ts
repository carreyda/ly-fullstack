import { createAdminCaptcha, verifyAdminCaptcha } from '@/api';

import type { SlideVerifyResultState } from '@/types';
import type { AdminCaptchaResponse } from '@repo/shared/types';

/**
 * 管理登录图片滑块弹框的挑战请求、服务端校验和销毁清理
 *
 * 挑战只在账号密码通过客户端表单校验后创建。请求编号会丢弃刷新竞态与关闭弹框后
 * 返回的过期响应；所有定时器在关闭或卸载时清除。
 *
 * @param onSuccess 服务端确认拼图位置后继续提交登录的方法
 * @returns 弹框渲染状态、挑战操作和开关方法
 */
export const useLoginCaptchaDialog = (onSuccess: (captchaId: string) => void) => {
  const dialogVisible = ref(false);
  const isLoading = ref(true);
  const captchaChallenge = ref<AdminCaptchaResponse | null>(null);
  const resultState = ref<SlideVerifyResultState>('default');
  let captchaRequestId = 0;
  let refreshTimer: number | undefined;
  let isUnmounted = false;
  let triggerElement: HTMLElement | null = null;

  /**
   * 清理当前弹框的延时任务
   */
  const clearRefreshTimer = (): void => {
    if (refreshTimer !== undefined) {
      window.clearTimeout(refreshTimer);
      refreshTimer = undefined;
    }
  };

  /**
   * 获取新的一次性图片挑战
   */
  const fetchCaptcha = async (): Promise<void> => {
    clearRefreshTimer();
    isLoading.value = true;
    resultState.value = 'default';
    captchaChallenge.value = null;
    const requestId = ++captchaRequestId;

    try {
      const challenge = await createAdminCaptcha();
      if (isUnmounted || !dialogVisible.value || requestId !== captchaRequestId) {
        return;
      }

      captchaChallenge.value = challenge;
    } catch {
      if (!isUnmounted && dialogVisible.value && requestId === captchaRequestId) {
        isLoading.value = false;
      }
    }
  };

  /**
   * 在账号密码表单校验通过后打开弹框并创建挑战
   */
  const open = (): void => {
    if (dialogVisible.value) {
      return;
    }

    triggerElement = document.activeElement as HTMLElement | null;
    dialogVisible.value = true;
    void fetchCaptcha();
  };

  /**
   * 关闭弹框、终止异步状态并把焦点还给原触发元素
   */
  const close = (): void => {
    if (!dialogVisible.value) {
      return;
    }

    dialogVisible.value = false;
    captchaRequestId += 1;
    clearRefreshTimer();
    captchaChallenge.value = null;
    resultState.value = 'default';
    isLoading.value = true;
    triggerElement?.focus({ preventScroll: true });
    triggerElement = null;
  };

  /**
   * 把用户实际拖动位置交给 Admin API 校验
   *
   * @param offset 相对验证图片的横向像素偏移
   */
  const handleVerify = async (offset: number): Promise<void> => {
    const challenge = captchaChallenge.value;
    if (!challenge || resultState.value !== 'default') {
      return;
    }

    resultState.value = 'verifying';
    try {
      await verifyAdminCaptcha({ captchaId: challenge.captchaId, offset });
      if (isUnmounted || !dialogVisible.value || captchaChallenge.value?.captchaId !== challenge.captchaId) {
        return;
      }

      resultState.value = 'success';
      refreshTimer = window.setTimeout(() => {
        close();
        onSuccess(challenge.captchaId);
      }, 360);
    } catch {
      if (isUnmounted || !dialogVisible.value || captchaChallenge.value?.captchaId !== challenge.captchaId) {
        return;
      }

      resultState.value = 'fail';
      refreshTimer = window.setTimeout(() => void fetchCaptcha(), 850);
    }
  };

  onUnmounted(() => {
    isUnmounted = true;
    captchaRequestId += 1;
    clearRefreshTimer();
  });

  return {
    dialogVisible,
    isLoading,
    captchaChallenge,
    resultState,
    open,
    close,
    fetchCaptcha,
    handleVerify,
  };
};
