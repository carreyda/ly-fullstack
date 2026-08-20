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
      <el-menu
        class="layout-side__menu"
        :collapse="props.collapsed"
        :collapse-transition="false"
        :default-active="ADMIN_NAV_HOME.key"
        :default-openeds="ADMIN_NAV_DEFAULT_OPENED_KEYS"
      >
        <el-menu-item :index="ADMIN_NAV_HOME.key" @click="handleHomeOpen">
          <component :is="ADMIN_NAV_HOME.icon" class="layout-side__menu-icon" :size="18" :stroke-width="1.8" />
          <span>{{ ADMIN_NAV_HOME.title }}</span>
        </el-menu-item>

        <el-sub-menu
          v-for="group in ADMIN_NAV_ITEMS"
          :key="group.key"
          :index="group.key"
          :expand-close-icon="ChevronDown"
          :expand-open-icon="ChevronUp"
        >
          <template #title>
            <component :is="group.icon" class="layout-side__menu-icon" :size="18" :stroke-width="1.8" />
            <span>{{ group.title }}</span>
          </template>

          <el-menu-item v-for="item in group.children" :key="item.key" :index="item.key">
            <component :is="item.icon" class="layout-side__menu-icon" :size="17" :stroke-width="1.8" />
            <span>{{ item.title }}</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
  </aside>
</template>

<script setup lang="ts">
/**
 * 导入 Vue Router 模块
 */
import { useRouter } from 'vue-router';

/**
 * 导入组件
 */
import { ChevronDown, ChevronUp } from '@lucide/vue';
import { ElMenu, ElMenuItem, ElSubMenu } from 'element-plus';
import 'element-plus/es/components/menu/style/index';
import 'element-plus/es/components/menu-item/style/index';
import 'element-plus/es/components/sub-menu/style/index';

/**
 * 导入常量
 */
import { ADMIN_NAV_DEFAULT_OPENED_KEYS, ADMIN_NAV_HOME, ADMIN_NAV_ITEMS } from '@/constants';

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

/**
 * 打开工作台首页
 */
const handleHomeOpen = (): void => {
  void router.push(ADMIN_NAV_HOME.path);
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

  &--collapsed &__menu-icon {
    margin-right: 0;
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
    overflow-x: hidden;
    overflow-y: auto;
    padding: 10px 0;
  }

  &__menu {
    width: 100%;
    border-right: 0;
    background: transparent;
  }

  &__menu-icon {
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    margin-right: 10px;
  }
}
</style>
