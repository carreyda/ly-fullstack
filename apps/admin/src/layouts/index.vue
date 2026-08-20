<template>
  <div class="admin-layout">
    <layout-side v-if="!isMobile" :collapsed="sidebarCollapsed"></layout-side>

    <el-drawer
      v-model="mobileMenuVisible"
      class="admin-layout__drawer"
      direction="ltr"
      size="230px"
      :with-header="false"
      :append-to-body="true"
    >
      <div class="admin-layout__drawer-brand">
        <span class="admin-layout__drawer-mark" aria-hidden="true">
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
        <span class="admin-layout__drawer-name">LY Fullstack</span>
      </div>
      <layout-menu @click.capture="handleMobileMenuClick"></layout-menu>
    </el-drawer>

    <section class="admin-layout__main">
      <layout-header :collapsed="sidebarCollapsed" :is-mobile="isMobile" @toggle="handleToggleSidebar"></layout-header>
      <main class="admin-layout__content">
        <router-view v-slot="{ Component, route }">
          <transition :name="transitionName" mode="out-in" appear>
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import LayoutHeader from '@/components/layouts/layout-header/index.vue';
import LayoutSide from '@/components/layouts/layout-side/index.vue';
import LayoutMenu from '@/components/layouts/layout-menu/index.vue';
import { useMediaQuery } from '@/hooks';

/**
 * 窄屏阈值：低于该宽度隐藏常驻侧栏，改用抽屉导航
 */
const MOBILE_BREAKPOINT_QUERY = '(max-width: 768px)';

/**
 * 中屏阈值：进入该区间时自动折叠侧栏，保留图标列避免挤压内容区
 */
const COLLAPSE_BREAKPOINT_QUERY = '(max-width: 1024px)';

/**
 * 页面切换动画名（动画类定义见 `assets/styles/modules/router-transition.scss`）
 */
const PAGE_TRANSITION = 'slide-left';

const isMobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
const shouldAutoCollapse = useMediaQuery(COLLAPSE_BREAKPOINT_QUERY);

const sidebarCollapsed = ref(false);
const mobileMenuVisible = ref(false);

/**
 * 首次加载不播放切换动画，避免刷新进入后台时的整页闪动
 */
const isFirstLoad = ref(true);

const transitionName = computed(() => (isFirstLoad.value ? '' : PAGE_TRANSITION));

/**
 * 跨过中屏断点时自动折叠/恢复侧栏；用户在中屏内的手动切换不被覆盖
 */
watch(shouldAutoCollapse, (autoCollapse) => {
  sidebarCollapsed.value = autoCollapse;
});

/**
 * 顶栏按钮在桌面端切换折叠，窄屏端打开抽屉
 */
const handleToggleSidebar = (): void => {
  if (isMobile.value) {
    mobileMenuVisible.value = true;
    return;
  }

  sidebarCollapsed.value = !sidebarCollapsed.value;
};

/**
 * 抽屉内点击菜单项后收起抽屉，避免选中二级页后遮罩继续挡住内容
 */
const handleMobileMenuClick = (event: MouseEvent): void => {
  const target = event.target as HTMLElement | null;

  if (target?.closest('.el-menu-item')) {
    mobileMenuVisible.value = false;
  }
};

onMounted(() => {
  // 初始即处于中屏时直接折叠，避免先渲染展开态再跳动
  sidebarCollapsed.value = shouldAutoCollapse.value;

  // 延迟一帧，确保首次渲染完成后再放开切换动画
  nextTick(() => {
    isFirstLoad.value = false;
  });
});
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--body-bg-color);
}

.admin-layout__main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.admin-layout__content {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  padding: var(--spacing-md);
}

@media (max-width: 768px) {
  .admin-layout__content {
    padding: var(--spacing-sm);
  }
}
</style>

<style lang="scss">
/**
 * 移动端抽屉挂载在 body 下，样式无法 scoped；只约束抽屉容器自身的边框与背景
 */
.admin-layout__drawer {
  .el-drawer__body {
    display: flex;
    flex-direction: column;
    padding: 0;
    border-right: 1px solid var(--card-border-color);
    background: var(--color-sidebar);
  }
}

.admin-layout__drawer-brand {
  display: flex;
  height: var(--layout-header-height);
  flex: 0 0 var(--layout-header-height);
  align-items: center;
  gap: 10px;
  padding: 0 var(--spacing-xl);
}

.admin-layout__drawer-mark {
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

.admin-layout__drawer-name {
  overflow: hidden;
  color: var(--gray-900);
  font-size: 17px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
