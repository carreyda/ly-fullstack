<template>
  <aside class="layout-side" :class="{ 'layout-side--collapsed': props.collapsed }">
    <header class="layout-side__header">
      <div class="layout-side__logo-wrap">
        <img class="layout-side__logo" src="@/assets/images/logo.svg" alt="" />
      </div>
      <div class="layout-side__brand">
        <strong class="layout-side__brand-name">LY Fullstack</strong>
      </div>
      <span class="layout-side__status" aria-hidden="true"></span>
    </header>
    <div class="layout-side__body">
      <el-scrollbar class="layout-side__scrollbar">
        <el-menu
          class="layout-side__menu"
          :collapse="props.collapsed"
          :collapse-transition="false"
          :default-active="activeMenuKey"
          :default-openeds="defaultOpenedKeys"
          @select="handleMenuSelect"
        >
          <layout-menu-item v-for="item in navigationItems" :key="item.key" :item="item" root />
        </el-menu>
      </el-scrollbar>
    </div>
  </aside>
</template>

<script setup lang="ts">
/**
 * 递归菜单组件负责按导航树层级渲染分组和叶子节点。
 */
import LayoutMenuItem from './menu-item.vue';
import { useLayoutMenu } from './composables/use-layout-menu';

/**
 * 侧栏专属 Composable 负责消费数据库会话菜单、建立视图树和处理路由跳转。
 */
const { navigationItems, defaultOpenedKeys, activeMenuKey, handleMenuSelect } = useLayoutMenu();

/**
 * 定义 props 的类型声明
 */
interface Props {
  /**
   * 是否折叠侧栏
   */
  collapsed?: boolean;
}

/**
 * 定义 props
 */
const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
});
</script>

<style lang="scss" scoped>
.layout-side {
  position: relative;
  width: 240px;
  height: 100%;
  flex: 0 0 240px;
  border-right: 1px solid var(--border-color);
  background: var(--fill-color);
  display: flex;
  flex-direction: column;
  transition:
    width var(--duration-normal) var(--ease-standard),
    flex-basis var(--duration-normal) var(--ease-standard);

  &--collapsed {
    width: 72px;
    flex-basis: 72px;
  }

  &--collapsed &__header {
    justify-content: center;
    padding: 0;
  }

  &--collapsed &__brand,
  &--collapsed &__status {
    display: none;
  }

  &__header {
    position: relative;
    display: flex;
    width: 100%;
    height: 60px;
    flex: 0 0 60px;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    border-bottom: 1px solid var(--border-color);
  }

  &__logo-wrap {
    display: grid;
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    place-items: center;
  }

  &__logo {
    display: block;
    width: 30px;
    height: 30px;
  }

  &__brand {
    min-width: 0;
    flex: 1;
  }

  &__brand-name {
    display: block;
    overflow: hidden;
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__status {
    width: 6px;
    height: 6px;
    flex: 0 0 6px;
    border-radius: 50%;
    background: var(--color-primary);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 10%, transparent);
  }

  &__body {
    min-height: 0;
    flex: 1;
    overflow: hidden;
    padding: 10px 0;
  }

  &__scrollbar {
    width: 100%;
    height: 100%;
  }

  &__menu {
    width: 100%;
    border-right: 0;
    background: transparent;
  }
}
</style>
