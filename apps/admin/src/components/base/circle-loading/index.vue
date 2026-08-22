<template>
  <span class="circle-loading" :style="loadingStyle" role="status" aria-label="加载中">
    <svg class="circle-loading__svg" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient :id="gradientId" x1="0%" y1="100%" x2="100%" y2="100%">
          <stop stop-color="currentColor" stop-opacity="0" offset="0%" />
          <stop stop-color="currentColor" stop-opacity="0.5" offset="39.9430698%" />
          <stop stop-color="currentColor" offset="100%" />
        </linearGradient>
      </defs>
      <path
        d="M34 18C34 9.163 26.837 2 18 2 11.66 2 6.181 5.688 3.591 11.035"
        :stroke="gradientStroke"
        stroke-width="4"
        stroke-linecap="round"
        fill="none"
      />
    </svg>
  </span>
</template>

<script setup lang="ts">
/**
 * 圆形加载指示器输入参数
 */
interface Props {
  /**
   * 指示器宽高，单位为 px
   */
  size?: number;

  /**
   * 指示器颜色，支持任意合法 CSS 颜色值
   */
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  color: 'var(--color-primary)',
});
const gradientId = `circle-loading-${useId()}`;
const gradientStroke = computed(() => `url(#${gradientId})`);
const loadingStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  color: props.color,
}));
</script>

<style lang="scss" src="./index.scss" scoped></style>
