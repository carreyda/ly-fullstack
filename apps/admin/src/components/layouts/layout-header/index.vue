<template>
  <header class="layout-header">
    <div class="layout-header__leading">
      <el-tooltip :content="isMobile ? '打开菜单' : collapsed ? '展开侧栏' : '折叠侧栏'" placement="bottom">
        <button
          class="layout-header__icon"
          type="button"
          :aria-label="isMobile ? '打开菜单' : '切换侧栏折叠'"
          @click="handleToggle"
        >
          <base-icon
            :name="isMobile ? 'Menu' : 'Fold'"
            :class="{ 'layout-header__icon--collapsed': !isMobile && collapsed }"
          />
        </button>
      </el-tooltip>

      <div class="layout-header__crumb" aria-current="page">
        <span class="layout-header__crumb-root">首页</span>
        <base-icon class="layout-header__crumb-separator" name="ArrowRight" />
        <span class="layout-header__crumb-current">{{ pageTitle }}</span>
      </div>
    </div>

    <div class="layout-header__actions">
      <el-tooltip content="刷新页面" placement="bottom">
        <button class="layout-header__icon" type="button" aria-label="刷新页面" @click="handleReload">
          <base-icon name="Refresh" />
        </button>
      </el-tooltip>
      <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏'" placement="bottom">
        <button
          class="layout-header__icon"
          type="button"
          :aria-label="isFullscreen ? '退出全屏' : '进入全屏'"
          @click="handleToggleFullscreen"
        >
          <base-icon name="FullScreen" />
        </button>
      </el-tooltip>

      <el-tooltip content="登录与用户体系将在下一阶段接入" placement="bottom">
        <div class="layout-header__user" aria-label="用户入口占位">
          <span class="layout-header__user-avatar" aria-hidden="true">
            <base-icon name="User" :size="15" />
          </span>
          <span class="layout-header__user-name">未登录</span>
          <base-icon class="layout-header__user-caret" name="CaretBottom" />
        </div>
      </el-tooltip>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  /** 侧栏是否折叠；仅桌面端展示折叠按钮状态 */
  collapsed: boolean;
  /** 是否为窄屏；窄屏下折叠按钮变为菜单入口 */
  isMobile: boolean;
}>();

const emit = defineEmits<{
  /** 点击折叠按钮或菜单按钮时触发，由布局层决定折叠侧栏还是打开抽屉 */
  (e: 'toggle'): void;
}>();

const route = useRoute();
const isFullscreen = ref(false);

/**
 * 顶栏面包屑尾段固定展示当前路由标题，与侧栏选中态保持同源
 */
const pageTitle = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : ''));

/**
 * 窄屏下按钮承担打开抽屉职责，桌面端切换侧栏折叠
 */
const handleToggle = (): void => {
  emit('toggle');
};

/**
 * 重新加载当前页面，用于用户主动获取最新运行状态。
 */
const handleReload = (): void => {
  window.location.reload();
};

/**
 * 切换浏览器全屏状态
 *
 * 全屏 API 返回 Promise，但当前交互不等待浏览器完成切换；组件状态会先按用户操作更新，
 * 实际是否进入全屏由浏览器权限和运行环境决定。监听 fullscreenchange 同步真实状态，
 * 避免用户通过 ESC 退出全屏后按钮文案与实际不符。
 */
const handleToggleFullscreen = (): void => {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }

  void document.documentElement.requestFullscreen();
};

const handleFullscreenChange = (): void => {
  isFullscreen.value = Boolean(document.fullscreenElement);
};

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});
</script>

<style lang="scss" scoped>
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--layout-header-height);
  flex: 0 0 var(--layout-header-height);
  padding: 0 var(--spacing-xl);
  border-bottom: 1px solid var(--card-border-color);
  background: var(--color-surface);
}

.layout-header__leading {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: var(--spacing-md);
}

.layout-header__crumb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.layout-header__crumb-root {
  color: var(--gray-500);
}

.layout-header__crumb-separator {
  color: var(--gray-400);
  font-size: 12px;
}

.layout-header__crumb-current {
  overflow: hidden;
  color: var(--gray-900);
  text-overflow: ellipsis;
}

.layout-header__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.layout-header__icon {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 17px;
  background: transparent;
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard);

  &:hover {
    color: var(--color-text-base);
    background: var(--color-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--focus-ring-color);
    outline-offset: -2px;
  }

  &:active {
    background: var(--color-active);
  }
}

.layout-header__icon--collapsed {
  transform: rotate(180deg);
  transition: transform var(--duration-normal) var(--ease-standard);
}

.layout-header__user {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: var(--spacing-sm);
  padding: 5px 12px;
  border-radius: 18px;
  color: var(--gray-500);
  font-size: var(--font-size-sm);
  background: var(--gray-100);
  cursor: default;
}

.layout-header__user-avatar {
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ffffff;
  background: var(--gray-400);
}

.layout-header__user-caret {
  font-size: 11px;
}

@media (max-width: 768px) {
  .layout-header {
    padding: 0 var(--spacing-lg);
  }

  .layout-header__crumb-root,
  .layout-header__crumb-separator {
    display: none;
  }

  .layout-header__user-name {
    display: none;
  }
}
</style>
