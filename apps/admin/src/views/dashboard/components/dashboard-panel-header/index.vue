<template>
  <header class="dashboard-panel-header">
    <div class="dashboard-panel-header__heading">
      <span class="dashboard-panel-header__icon" aria-hidden="true">
        <component :is="props.icon" :size="17" :stroke-width="1.8" />
      </span>
      <div class="dashboard-panel-header__content">
        <p class="dashboard-panel-header__eyebrow">{{ props.eyebrow }}</p>
        <h2 class="dashboard-panel-header__title">{{ props.title }}</h2>
        <p class="dashboard-panel-header__description">{{ props.description }}</p>
      </div>
    </div>

    <div class="dashboard-panel-header__meta">
      <slot name="meta"></slot>
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * Vue 组件类型用于约束标题区接收的 Lucide 图标组件。
 */
import type { Component } from 'vue';

/**
 * Dashboard 面板统一标题区输入属性。
 */
interface Props {
  /**
   * 标题区左侧展示的业务语义图标。
   */
  icon: Component;

  /**
   * 标题上方用于标识模块类别的短名称。
   */
  eyebrow: string;

  /**
   * 当前面板的主标题。
   */
  title: string;

  /**
   * 主标题下方用于解释面板内容的简短介绍。
   */
  description: string;
}

/**
 * 定义 props。
 */
const props = defineProps<Props>();
</script>

<style lang="scss" src="./index.scss" scoped></style>
