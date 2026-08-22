<template>
  <div
    ref="trackRef"
    class="base-slide-verify"
    :class="stateClass"
    :aria-disabled="props.disabled"
    @selectstart.prevent
  >
    <div class="base-slide-verify__progress" :style="progressStyle"></div>
    <span class="base-slide-verify__label">{{ statusText }}</span>

    <button
      class="base-slide-verify__handle"
      :style="handleStyle"
      type="button"
      role="slider"
      aria-label="登录安全滑块"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(progress * 100)"
      :aria-valuetext="statusText"
      :disabled="props.disabled"
      @keydown="handleKeydown"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerCancel"
    >
      <Check v-if="verified" :size="18" :stroke-width="2.2" />
      <ChevronsRight v-else :size="18" :stroke-width="2" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Check, ChevronsRight } from '@lucide/vue';
import { useSlideVerify } from './composables/use-slide-verify';

/**
 * 父级持有的滑块验证结果
 */
const verified = defineModel<boolean>({ default: false });

/**
 * 滑块验证组件输入参数
 */
interface Props {
  /**
   * 是否禁止操作滑块
   */
  disabled?: boolean;
}

/**
 * 禁用状态默认允许用户操作
 */
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

/**
 * 组件只装配可访问性属性与图标，指针、键盘和验证状态由私有 Composable 统一管理。
 */
const {
  trackRef,
  progress,
  stateClass,
  handleStyle,
  progressStyle,
  statusText,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handlePointerCancel,
  handleKeydown,
} = useSlideVerify({
  verified,
  getDisabled: () => props.disabled,
});
</script>

<style lang="scss" src="./index.scss" scoped></style>
