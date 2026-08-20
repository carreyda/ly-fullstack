<template>
  <article
    ref="cardRef"
    class="fluid-glass-card"
    :class="{ 'fluid-glass-card--fallback': isFallback }"
    :style="cardStyle"
  >
    <canvas ref="canvasRef" class="fluid-glass-card__canvas" aria-hidden="true"></canvas>
    <div class="fluid-glass-card__fallback" aria-hidden="true"></div>
    <div class="fluid-glass-card__noise" aria-hidden="true"></div>

    <div class="fluid-glass-card__content">
      <p class="fluid-glass-card__eyebrow">{{ props.eyebrow }}</p>
      <h3 class="fluid-glass-card__title">{{ props.title }}</h3>
      <div class="fluid-glass-card__metric">
        <strong class="fluid-glass-card__value">{{ props.value }}</strong>
        <span v-if="props.unit" class="fluid-glass-card__unit">{{ props.unit }}</span>
      </div>
      <p class="fluid-glass-card__change">
        <span>{{ props.metaLabel }}</span>
        <span :class="trendClass">{{ props.trendText }}</span>
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
/**
 * 导入 Vue 模块
 */
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import type { CSSProperties } from 'vue';

/**
 * 导入 Fluid Glass 渲染器
 */
import { createFluidGlassRenderer } from './renderer';

/**
 * 定义 props 的类型声明
 */
interface Props {
  eyebrow: string;
  title: string;
  value: string;
  unit?: string;
  metaLabel: string;
  trendText: string;
  trendTone?: 'positive' | 'negative';
  colorA?: string;
  colorB?: string;
  colorC?: string;
  speed?: number;
  intensity?: number;
  pointer?: number;
  surface?: number;
  seed?: number;
}

/**
 * 定义 props
 */
const props = withDefaults(defineProps<Props>(), {
  unit: '',
  trendTone: 'positive',
  colorA: '#1de9a0',
  colorB: '#34d8ff',
  colorC: '#075f54',
  speed: 0.9,
  intensity: 1,
  pointer: 0.8,
  surface: 0.08,
  seed: 1.7,
});

/**
 * 定义响应式数据
 */
const cardRef = useTemplateRef<HTMLElement>('cardRef');
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef');
const isFallback = ref(false);
let destroyRenderer: (() => void) | undefined;

/**
 * 计算属性
 */
const trendClass = computed(() =>
  props.trendTone === 'positive'
    ? 'fluid-glass-card__change-value--positive'
    : 'fluid-glass-card__change-value--negative',
);
const cardStyle = computed<CSSProperties>(() => ({
  '--fluid-a': props.colorA,
  '--fluid-b': props.colorB,
  '--fluid-c': props.colorC,
  '--surface-opacity': String(props.surface),
}));

/**
 * 生命周期函数
 */
onMounted(() => {
  if (!cardRef.value || !canvasRef.value) {
    isFallback.value = true;
    return;
  }

  destroyRenderer = createFluidGlassRenderer(
    cardRef.value,
    canvasRef.value,
    {
      colorA: props.colorA,
      colorB: props.colorB,
      colorC: props.colorC,
      speed: props.speed,
      intensity: props.intensity,
      pointer: props.pointer,
      surface: props.surface,
      seed: props.seed,
    },
    () => {
      isFallback.value = true;
    },
  );
});

onBeforeUnmount(() => {
  destroyRenderer?.();
});
</script>

<style lang="scss" src="./index.scss" scoped></style>
