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
          :default-active="route.path"
          :default-openeds="ADMIN_NAV_DEFAULT_OPENED_KEYS"
          @select="handleMenuSelect"
        >
          <layout-menu-item v-for="item in ADMIN_NAV_ITEMS" :key="item.key" :item="item" root />
        </el-menu>
      </el-scrollbar>
    </div>
  </aside>
</template>

<script setup lang="ts">
/**
 * 导入 Vue Router 模块
 */
import { useRoute, useRouter } from 'vue-router';

import LayoutMenuItem from './menu-item.vue';

/**
 * 导入常量
 */
import { ADMIN_NAV_DEFAULT_OPENED_KEYS, ADMIN_NAV_ITEMS } from '@/constants';
import type { AdminNavItem } from '@/constants/modules/nav';

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

/**
 * 引入路由
 */
const router = useRouter();
const route = useRoute();

/**
 * 在导航树中查找节点对应的路由地址
 *
 * @param items 导航树节点
 * @param key 菜单唯一标识
 * @returns 路由地址，不存在时返回 undefined
 */
const findNavPath = (items: AdminNavItem[], key: string): string | undefined => {
  for (const item of items) {
    if (item.key === key) {
      return item.path;
    }

    if (item.children?.length) {
      const childPath = findNavPath(item.children, key);

      if (childPath) {
        return childPath;
      }
    }
  }

  return undefined;
};

/**
 * 打开叶子菜单绑定的页面
 *
 * @param key 菜单唯一标识
 */
const handleMenuSelect = (key: string): void => {
  const path = findNavPath(ADMIN_NAV_ITEMS, key);

  if (path && path !== route.path) {
    void router.push(path);
  }
};
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
