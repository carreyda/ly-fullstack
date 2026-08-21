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
/**
 * 导入图标组件
 */
import { Check, ChevronsRight } from '@lucide/vue';

/**
 * 导入 hooks
 */
import { useSlideVerify } from './hooks/use-slide-verify';

/**
 * 定义双向数据绑定
 */
const verified = defineModel<boolean>({ default: false });

/**
 * 定义 props 的类型声明
 */
interface Props {
  /**
   * 是否禁止操作滑块
   */
  disabled?: boolean;
}

/**
 * 定义 props
 */
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

/**
 * 引入 hooks
 *
 * 组件只装配可访问性属性与图标，指针、键盘和验证状态由私有 Hook 统一管理。
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
