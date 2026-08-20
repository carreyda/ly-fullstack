<template>
  <el-menu
    class="layout-menu"
    :default-active="activePath"
    :default-openeds="defaultOpeneds"
    :collapse="collapsed"
    :collapse-transition="false"
    router
  >
    <template v-for="item in navItems" :key="'title' in item ? item.title : ''">
      <el-sub-menu v-if="'children' in item" :index="item.key">
        <template #title>
          <base-icon class="layout-menu__icon" :name="item.icon" />
          <span>{{ item.title }}</span>
        </template>
        <el-menu-item v-for="child in item.children" :key="child.path" :index="child.path">
          <span>{{ child.title }}</span>
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item v-else :index="item.path">
        <base-icon class="layout-menu__icon" :name="item.icon" />
        <template #title>
          <span>{{ item.title }}</span>
        </template>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { ADMIN_NAV_ITEMS } from '@/constants';

/**
 * 主导航菜单
 *
 * 桌面侧栏与移动端抽屉共用该组件，保证两套入口的选中态、分组展开和折叠表现一致。
 * 菜单项激活色、悬停色通过宿主覆盖 `--el-menu-*` 变量控制。
 */
withDefaults(
  defineProps<{
    /** 是否折叠为图标列；折叠态只在桌面侧栏使用 */
    collapsed?: boolean;
  }>(),
  {
    collapsed: false,
  },
);

const route = useRoute();

/**
 * 菜单选中态跟随当前路由路径，刷新或直接输入地址时也能保持高亮
 */
const activePath = computed(() => route.path);

/**
 * 全部分组 key，作为 el-menu 的 default-openeds 让分组默认展开
 */
const defaultOpeneds = ADMIN_NAV_ITEMS.filter((item) => 'children' in item).map((item) => item.key);

/**
 * 静态导航数据；接入 RBAC 后替换为服务端菜单树
 */
const navItems = ADMIN_NAV_ITEMS;
</script>

<style lang="scss" scoped>
.layout-menu {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--color-sidebar-text);
  --el-menu-hover-bg-color: var(--color-sidebar-hover);
  --el-menu-active-color: var(--color-sidebar-text-active);
  --el-menu-item-height: 42px;
  --el-menu-item-font-size: 14px;
  --el-menu-collapse-width: var(--layout-sidebar-collapsed-width);

  padding: var(--spacing-md) 0;
  border-right: none;

  &:not(.el-menu--collapse) {
    width: 100%;
  }

  .el-menu-item,
  .el-sub-menu__title {
    width: calc(100% - 16px);
    height: 42px;
    margin-bottom: 4px;
    margin-left: 8px;
    border-radius: 6px;
    font-weight: 500;
    line-height: 42px;
    transition:
      color var(--duration-fast) var(--ease-standard),
      background-color 0s;

    &:hover {
      color: var(--color-sidebar-text);
      background: var(--color-sidebar-hover);
    }

    &:focus-visible {
      outline: 2px solid var(--focus-ring-color);
      outline-offset: -2px;
    }
  }

  .el-menu-item.is-active,
  .el-menu-item.is-active:hover {
    color: var(--color-sidebar-text-active);
    background: var(--color-sidebar-active);
  }

  .el-sub-menu__icon-arrow {
    width: 13px;
    color: var(--gray-600);
    font-size: 13px;
  }

  .el-menu.el-menu--inline {
    transition: max-height 0.26s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.layout-menu__icon {
  margin: 0 8px 0 -7px;
  font-size: 20px;
}
</style>
