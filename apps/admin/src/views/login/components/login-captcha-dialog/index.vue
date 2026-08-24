<template>
  <teleport to="body">
    <transition name="login-captcha-dialog">
      <div v-if="dialogVisible" class="login-captcha-dialog">
        <section
          ref="dialogPanelRef"
          class="login-captcha-dialog__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-captcha-title"
          @keydown.esc="close"
          @keydown.tab="handleTabKeydown"
        >
          <header class="login-captcha-dialog__header">
            <div>
              <span>安全验证</span>
              <h3 id="login-captcha-title">拖动拼图完成验证</h3>
            </div>

            <button
              ref="closeButtonRef"
              class="login-captcha-dialog__close"
              type="button"
              aria-label="关闭图片验证"
              @click="close"
            >
              <X :size="19" />
            </button>
          </header>

          <div class="login-captcha-dialog__content">
            <slide-verify
              v-if="captchaChallenge"
              :key="captchaChallenge.captchaId"
              :challenge="captchaChallenge"
              :loading="isLoading"
              :result-state="resultState"
              @ready="isLoading = false"
              @refresh="fetchCaptcha"
              @verify="handleVerify"
            />

            <div v-else class="login-captcha-dialog__status">
              <circle-loading v-if="isLoading" :size="32" />
              <button v-else class="login-captcha-dialog__retry" type="button" @click="fetchCaptcha">
                重新加载图片验证
              </button>
            </div>
          </div>
        </section>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue';

import SlideVerify from '../slide-verify/index.vue';
import { useLoginCaptchaDialog } from './composables/use-login-captcha-dialog';

/**
 * 登录图片验证弹框事件
 */
interface Emits {
  /**
   * Admin API 已经确认拼图位置，可以继续提交登录
   */
  (event: 'success', captchaId: string): void;
}

const emit = defineEmits<Emits>();
const dialogPanelRef = useTemplateRef<HTMLElement>('dialogPanelRef');
const closeButtonRef = useTemplateRef<HTMLButtonElement>('closeButtonRef');
const { dialogVisible, isLoading, captchaChallenge, resultState, open, close, fetchCaptcha, handleVerify } =
  useLoginCaptchaDialog((captchaId) => emit('success', captchaId));

/**
 * 把 Tab 键焦点约束在当前模态弹框内
 *
 * @param event 弹框内的键盘 Tab 事件
 */
const handleTabKeydown = (event: KeyboardEvent): void => {
  const focusableElements = dialogPanelRef.value?.querySelectorAll<HTMLElement>('button:not([disabled])');
  if (!focusableElements?.length) {
    return;
  }

  const firstElement = focusableElements.item(0);
  const lastElement = focusableElements.item(focusableElements.length - 1);
  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
};

/**
 * 弹框出现后把焦点移到关闭按钮，键盘用户可以直接退出验证。
 */
watch(dialogVisible, async (visible) => {
  if (!visible) {
    return;
  }

  await nextTick();
  closeButtonRef.value?.focus({ preventScroll: true });
});

/**
 * 登录页只需要显式打开弹框，挑战创建与校验生命周期由弹框自行管理。
 */
defineExpose({ open });
</script>

<style lang="scss" src="./index.scss" scoped></style>
