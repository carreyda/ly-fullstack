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

<style lang="scss" src="./index.scss" scoped></style>
