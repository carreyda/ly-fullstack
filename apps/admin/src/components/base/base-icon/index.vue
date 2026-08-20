<template>
  <span v-if="iconComponent" class="base-icon" :style="iconStyle" aria-hidden="true" @click="handleClick">
    <component :is="iconComponent" class="base-icon__svg" />
  </span>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  CaretBottom,
  DataBoard,
  Fold,
  FullScreen,
  Link,
  Menu,
  Monitor,
  Refresh,
  User,
} from '@element-plus/icons-vue';

import type { Component, StyleValue } from 'vue';
import type { BaseIconName } from '@/types';

/**
 * 基础图标组件映射
 *
 * 业务组件只能通过 `base-icon` 使用图标，不直接导入 Element Plus 图标组件。
 * 当前映射只维护真实用到的图标，避免动态透传整包图标导致首屏体积不可控。
 */
const BASE_ICON_COMPONENT_MAP: Record<BaseIconName, Component> = {
  ArrowRight,
  CaretBottom,
  DataBoard,
  Fold,
  FullScreen,
  Link,
  Menu,
  Monitor,
  Refresh,
  User,
};

const props = defineProps<{
  /** 图标名称，来源于 Element Plus 图标集中真实用到的子集 */
  name: BaseIconName;
  /** 图标字号，默认跟随文字 */
  size?: number | string;
  /** 图标颜色，默认继承当前文字色 */
  color?: string;
}>();

const emit = defineEmits<{
  /** 点击图标时触发 */
  (e: 'click', event: MouseEvent): void;
}>();

/**
 * 当前名称对应的图标组件；名称未登记时不渲染，避免整包导入
 */
const iconComponent = computed<Component>(() => BASE_ICON_COMPONENT_MAP[props.name]);

/**
 * 尺寸与颜色透传为内联样式，保持图标与文本排版一致
 */
const iconStyle = computed<StyleValue>(() => ({
  fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
  color: props.color,
}));

/**
 * 转发原生点击事件，供按钮类宿主直接监听
 */
const handleClick = (event: MouseEvent): void => {
  emit('click', event);
};
</script>

<style lang="scss" scoped>
.base-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  vertical-align: middle;

  &__svg {
    width: 1em;
    height: 1em;
  }
}
</style>
