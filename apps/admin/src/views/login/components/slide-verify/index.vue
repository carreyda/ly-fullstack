<template>
  <div class="slide-verify" @selectstart.prevent>
    <div class="slide-verify__picture" :style="pictureStyle">
      <img
        class="slide-verify__background"
        :src="props.challenge.backgroundImage"
        alt=""
        draggable="false"
        @error="handleImageError"
        @load="handleImageReady"
      />
      <img
        class="slide-verify__puzzle"
        :src="props.challenge.puzzleImage"
        alt=""
        draggable="false"
        :style="puzzleStyle"
        @error="handleImageError"
        @load="handleImageReady"
      />

      <div v-if="imageLoadFailed" class="slide-verify__error" role="alert">
        <span>验证图片加载失败</span>
        <button type="button" @click="emit('refresh')">重新加载</button>
      </div>

      <div v-else-if="props.loading" class="slide-verify__loading">
        <circle-loading :size="30" />
      </div>

      <button
        v-if="!imageLoadFailed"
        class="slide-verify__refresh"
        type="button"
        aria-label="刷新图片验证"
        @click="emit('refresh')"
      >
        <RefreshCw :size="17" />
      </button>
    </div>

    <div ref="sliderTrackRef" class="slide-verify__track" :class="trackStateClass" data-testid="login-captcha-track">
      <div class="slide-verify__mask" :style="sliderMaskStyle"></div>
      <span>{{ statusText }}</span>
      <button
        class="slide-verify__handle"
        type="button"
        role="slider"
        aria-label="拖动滑块完成图片验证"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(progress * 100)"
        :aria-valuetext="statusText"
        :disabled="isInteractionDisabled"
        :style="sliderStyle"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerCancel"
      >
        <Check v-if="props.resultState === 'success'" :size="18" />
        <X v-else-if="props.resultState === 'fail'" :size="18" />
        <LoaderCircle v-else-if="props.resultState === 'verifying'" class="slide-verify__spinner" :size="18" />
        <ChevronsRight v-else :size="18" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, ChevronsRight, LoaderCircle, RefreshCw, X } from '@lucide/vue';

import type { SlideVerifyResultState } from '@/types';
import type { AdminCaptchaResponse } from '@repo/shared/types';

import { useSlideVerify } from './composables/use-slide-verify';

/**
 * 验证图片等待上限，避免资源异常时 Loading 永久遮挡刷新入口
 */
const IMAGE_LOAD_TIMEOUT = 10_000;

/**
 * 图片滑块组件输入参数
 */
interface Props {
  /**
   * Admin API 生成的当前图片挑战
   */
  challenge: AdminCaptchaResponse;

  /**
   * 挑战请求或图片资源是否仍在加载
   */
  loading?: boolean;

  /**
   * Admin API 对当前拖动位置的校验状态
   */
  resultState?: SlideVerifyResultState;
}

/**
 * 图片滑块组件事件
 */
interface Emits {
  /**
   * 用户松开滑块后提交实际偏移量
   */
  verify: [offset: number];

  /**
   * 用户主动刷新挑战
   */
  refresh: [];

  /**
   * 背景图和拼图块都已经加载完成
   */
  ready: [];

  /**
   * 任意验证图片加载失败或在限定时间内未全部就绪
   */
  error: [];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  resultState: 'default',
});
const emit = defineEmits<Emits>();

/**
 * 计数当前挑战的两张 Data URL 图片，两者都完成后才允许拖动。
 */
const readyImageCount = ref(0);
const imageLoadFailed = ref(false);
let imageLoadTimer: number | undefined;

/**
 * 按服务端图片尺寸维持验证区域比例
 */
const pictureStyle = computed(() => ({
  aspectRatio: `${props.challenge.imageWidth} / ${props.challenge.imageHeight}`,
}));

/**
 * 只有请求、图片加载和服务端校验全部结束后才允许继续拖动
 */
const isInteractionDisabled = computed(
  () => imageLoadFailed.value || props.loading || readyImageCount.value < 2 || props.resultState !== 'default',
);

/**
 * 清理当前挑战的图片加载超时任务
 */
const clearImageLoadTimer = (): void => {
  if (imageLoadTimer !== undefined) {
    window.clearTimeout(imageLoadTimer);
    imageLoadTimer = undefined;
  }
};

/**
 * 标记图片加载失败并通知弹框结束 Loading
 */
const handleImageError = (): void => {
  if (imageLoadFailed.value || readyImageCount.value === 2) {
    return;
  }

  imageLoadFailed.value = true;
  clearImageLoadTimer();
  emit('error');
};

/**
 * 为当前挑战启动图片加载超时保护
 */
const startImageLoadTimer = (): void => {
  clearImageLoadTimer();
  if (readyImageCount.value === 2 || imageLoadFailed.value) {
    return;
  }

  imageLoadTimer = window.setTimeout(handleImageError, IMAGE_LOAD_TIMEOUT);
};

/**
 * 统计图片就绪状态并通知弹框关闭加载层
 */
const handleImageReady = (): void => {
  if (imageLoadFailed.value || readyImageCount.value === 2) {
    return;
  }

  readyImageCount.value += 1;
  if (readyImageCount.value === 2) {
    clearImageLoadTimer();
    emit('ready');
  }
};

const {
  sliderTrackRef,
  progress,
  trackStateClass,
  puzzleStyle,
  sliderStyle,
  sliderMaskStyle,
  statusText,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handlePointerCancel,
} = useSlideVerify({
  getChallenge: () => props.challenge,
  getResultState: () => props.resultState,
  isLoading: () => isInteractionDisabled.value,
  onVerify: (offset) => emit('verify', offset),
});

watch(
  () => props.challenge.captchaId,
  () => {
    readyImageCount.value = 0;
    imageLoadFailed.value = false;
    startImageLoadTimer();
  },
);

onMounted(startImageLoadTimer);

onBeforeUnmount(clearImageLoadTimer);
</script>

<style lang="scss" src="./index.scss" scoped></style>
