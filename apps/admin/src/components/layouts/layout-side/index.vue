<template>
  <aside class="layout-side" :class="{ 'layout-side--collapsed': collapsed }">
    <div class="layout-side__brand">
      <span class="layout-side__brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1.5" y="1.5" width="29" height="29" rx="7.5" stroke="currentColor" stroke-width="3" />
          <path
            d="M10 21.5V10.5L22 21.5V10.5"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span class="layout-side__brand-name">LY Fullstack</span>
    </div>

    <el-scrollbar class="layout-side__scroll">
      <layout-menu :collapsed="collapsed"></layout-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
import LayoutMenu from '@/components/layouts/layout-menu/index.vue';

/**
 * 后台侧栏
 *
 * 桌面端常驻左侧，接收折叠状态在 230px 与 64px 之间过渡；窄屏下由布局层隐藏本组件并改用抽屉。
 */
defineProps<{
  /** 是否折叠为图标列 */
  collapsed: boolean;
}>();
</script>

<style lang="scss" scoped>
.layout-side {
  display: flex;
  width: var(--layout-sidebar-width);
  flex: 0 0 var(--layout-sidebar-width);
  flex-direction: column;
  border-right: 1px solid var(--card-border-color);
  background: var(--color-sidebar);
  transition:
    width var(--duration-normal) var(--ease-standard),
    flex-basis var(--duration-normal) var(--ease-standard);
  user-select: none;

  &--collapsed {
    width: var(--layout-sidebar-collapsed-width);
    flex-basis: var(--layout-sidebar-collapsed-width);
  }
}

.layout-side__brand {
  display: flex;
  height: var(--layout-header-height);
  flex: 0 0 var(--layout-header-height);
  align-items: center;
  gap: 10px;
  padding: 0 var(--spacing-xl);
  overflow: hidden;
}

.layout-side--collapsed .layout-side__brand {
  padding: 0;
  justify-content: center;
}

.layout-side__brand-mark {
  display: flex;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);

  svg {
    width: 28px;
    height: 28px;
  }
}

.layout-side__brand-name {
  overflow: hidden;
  color: var(--gray-900);
  font-size: 17px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layout-side--collapsed .layout-side__brand-name {
  display: none;
}

.layout-side__scroll {
  min-height: 0;
  flex: 1;
}
</style>
