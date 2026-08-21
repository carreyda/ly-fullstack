<template>
  <div ref="containerRef" class="base-aurora" :class="{ 'base-aurora--fallback': isFallback }" aria-hidden="true" />
</template>

<script setup lang="ts">
/**
 * Vue 生命周期、模板引用和监听能力负责连接组件属性与 OGL 渲染器。
 */
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';

/**
 * Aurora 渲染器封装画布创建、噪声着色器、容器尺寸监听和 WebGL 资源释放。
 */
import { createAuroraRenderer } from './renderer';

/**
 * Aurora 类型约束颜色停靠点数量以及渲染器控制接口。
 */
import type { AuroraColorStops, AuroraRendererControl } from '@/types';

/**
 * 定义 props 的类型声明
 */
interface Props {
  /**
   * 从左到右参与极光混合的三个颜色停靠点
   */
  colorStops?: AuroraColorStops;

  /**
   * 极光波形随时间变化的速度系数
   */
  speed?: number;

  /**
   * 极光边缘的颜色混合宽度
   */
  blend?: number;

  /**
   * 极光波形在垂直方向的振幅
   */
  amplitude?: number;

  /**
   * 可选的固定时间值，设置后画面不再随真实时间推进
   */
  time?: number;
}

/**
 * 定义 props
 */
const props = withDefaults(defineProps<Props>(), {
  colorStops: () => ['#171d22', '#7cff67', '#171d22'],
  speed: 1,
  blend: 0.5,
  amplitude: 1,
  time: undefined,
});

/**
 * 定义响应式数据
 */
const containerRef = useTemplateRef<HTMLDivElement>('containerRef');
const isFallback = ref(false);
let rendererControl: AuroraRendererControl | undefined;

/**
 * 获取当前 Aurora 渲染参数
 *
 * @returns 可直接交给 OGL 渲染器的完整参数
 */
const getRenderOptions = () => ({
  colorStops: props.colorStops,
  speed: props.speed,
  blend: props.blend,
  amplitude: props.amplitude,
  time: props.time,
});

/**
 * 创建 Aurora 渲染器
 *
 * WebGL 初始化失败时保留透明容器作为静默降级，不影响登录表单和机械主体继续显示。
 */
const setupRenderer = (): void => {
  if (!containerRef.value) {
    isFallback.value = true;
    return;
  }

  rendererControl = createAuroraRenderer(containerRef.value, getRenderOptions(), () => {
    isFallback.value = true;
  });
};

/**
 * 监听事件
 */
watch(
  () => [props.colorStops, props.speed, props.blend, props.amplitude, props.time] as const,
  () => {
    rendererControl?.update(getRenderOptions());
  },
  { deep: true },
);

/**
 * 生命周期函数
 */
onMounted(() => {
  setupRenderer();
});

onBeforeUnmount(() => {
  rendererControl?.destroy();
  rendererControl = undefined;
});
</script>

<style lang="scss" src="./index.scss" scoped></style>
