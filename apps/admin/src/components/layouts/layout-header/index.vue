<template>
  <header class="layout-header">
    <div class="layout-header__left">
      <button class="layout-header__action" type="button" aria-label="切换侧栏" @click="handleSidebarToggle">
        <panel-left-open v-if="props.sidebarCollapsed" :size="19" :stroke-width="1.8" />
        <panel-left-close v-else :size="19" :stroke-width="1.8" />
      </button>

      <button class="layout-header__action" type="button" aria-label="刷新当前页面" @click="handleRefresh">
        <refresh-cw :size="18" :stroke-width="1.8" />
      </button>

      <nav class="layout-header__breadcrumb" aria-label="面包屑">
        <template v-for="(item, index) in breadcrumbList" :key="`${item}-${index}`">
          <span v-if="index > 0" class="layout-header__breadcrumb-separator">/</span>
          <span
            class="layout-header__breadcrumb-item"
            :class="{ 'layout-header__breadcrumb-item--current': index === breadcrumbList.length - 1 }"
          >
            {{ item }}
          </span>
        </template>
      </nav>
    </div>

    <div class="layout-header__right">
      <button class="layout-header__action" type="button" aria-label="切换全屏" @click="handleFullscreenToggle">
        <minimize-2 v-if="isFullscreen" :size="18" :stroke-width="1.8" />
        <maximize-2 v-else :size="18" :stroke-width="1.8" />
      </button>

      <button class="layout-header__action layout-header__notification" type="button" aria-label="查看通知">
        <bell :size="18" :stroke-width="1.8" />
        <span class="layout-header__notification-dot" aria-hidden="true"></span>
      </button>

      <button class="layout-header__action" type="button" aria-label="切换主题" @click="handleThemeToggle">
        <sun v-if="isDarkTheme" :size="18" :stroke-width="1.8" />
        <moon v-else :size="18" :stroke-width="1.8" />
      </button>

      <div ref="profileRef" class="layout-header__profile">
        <button
          class="layout-header__profile-trigger"
          type="button"
          aria-haspopup="menu"
          :aria-expanded="isProfileOpen"
          @click="handleProfileToggle"
        >
          <span class="layout-header__avatar">LY</span>
          <span class="layout-header__profile-name">管理员</span>
          <chevron-down
            class="layout-header__profile-arrow"
            :class="{ 'layout-header__profile-arrow--open': isProfileOpen }"
            :size="15"
            :stroke-width="1.8"
          />
        </button>

        <div v-show="isProfileOpen" class="layout-header__profile-menu" role="menu">
          <button type="button" role="menuitem" @click="handleProfileCommand">
            <user-round :size="16" :stroke-width="1.8" />
            <span>个人中心</span>
          </button>
          <button type="button" role="menuitem" @click="handleProfileCommand">
            <key-round :size="16" :stroke-width="1.8" />
            <span>修改密码</span>
          </button>
          <div class="layout-header__profile-divider"></div>
          <button class="layout-header__profile-logout" type="button" role="menuitem" @click="handleProfileCommand">
            <log-out :size="16" :stroke-width="1.8" />
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * 导入 Vue 模块
 */
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

/**
 * 导入 Vue Router 模块
 */
import { useRoute } from 'vue-router';

/**
 * 导入组件
 */
import {
  Bell,
  ChevronDown,
  KeyRound,
  LogOut,
  Maximize2,
  Minimize2,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Sun,
  UserRound,
} from '@lucide/vue';

/**
 * 定义 props 的类型声明
 */
interface Props {
  /**
   * 侧栏是否处于折叠状态
   */
  sidebarCollapsed?: boolean;
}

/**
 * 定义 props
 */
const props = withDefaults(defineProps<Props>(), {
  sidebarCollapsed: false,
});

/**
 * 定义 emits 的类型声明
 */
interface Emits {
  sidebarToggle: [];
}

/**
 * 定义 emits
 */
const emits = defineEmits<Emits>();

/**
 * 引入路由
 */
const route = useRoute();

/**
 * 定义响应式数据
 */
const profileRef = useTemplateRef<HTMLElement>('profileRef');
const isFullscreen = ref(false);
const isDarkTheme = ref(true);
const isProfileOpen = ref(false);

/**
 * 计算属性
 * 作用：根据当前路由生成顶部面包屑，首页作为固定起点。
 */
const breadcrumbList = computed(() => {
  const routeTitleList = route.matched
    .map((item) => item.meta.title)
    .filter((title): title is string => typeof title === 'string');

  return ['首页', ...routeTitleList];
});

/**
 * 切换侧栏折叠状态
 */
const handleSidebarToggle = (): void => {
  emits('sidebarToggle');
};

/**
 * 刷新当前页面
 */
const handleRefresh = (): void => {
  window.location.reload();
};

/**
 * 切换浏览器全屏状态
 */
const handleFullscreenToggle = async (): Promise<void> => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await document.documentElement.requestFullscreen();
  } catch {
    isFullscreen.value = Boolean(document.fullscreenElement);
  }
};

/**
 * 同步浏览器全屏状态
 */
const handleFullscreenChange = (): void => {
  isFullscreen.value = Boolean(document.fullscreenElement);
};

/**
 * 切换黑白主题，并从主题按钮中心播放圆形扩散动画
 *
 * @param event 主题按钮点击事件
 */
const handleThemeToggle = async (event: MouseEvent): Promise<void> => {
  const switchTheme = (): void => {
    isDarkTheme.value = !isDarkTheme.value;
    document.documentElement.dataset.theme = isDarkTheme.value ? 'dark' : 'light';
  };
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof document.startViewTransition !== 'function' || prefersReducedMotion) {
    switchTheme();
    return;
  }

  const buttonRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const originX = buttonRect.left + buttonRect.width / 2;
  const originY = buttonRect.top + buttonRect.height / 2;
  const radius = Math.hypot(
    Math.max(originX, window.innerWidth - originX),
    Math.max(originY, window.innerHeight - originY),
  );
  const transition = document.startViewTransition(switchTheme);

  await transition.ready;
  document.documentElement.animate(
    {
      clipPath: [`circle(0 at ${originX}px ${originY}px)`, `circle(${radius}px at ${originX}px ${originY}px)`],
    },
    {
      duration: 520,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      pseudoElement: '::view-transition-new(root)',
    },
  );
};

/**
 * 切换头像菜单
 */
const handleProfileToggle = (): void => {
  isProfileOpen.value = !isProfileOpen.value;
};

/**
 * 关闭头像菜单
 */
const handleProfileCommand = (): void => {
  isProfileOpen.value = false;
};

/**
 * 点击头像区域外部时关闭菜单
 *
 * @param event 浏览器指针事件
 */
const handleDocumentPointerDown = (event: PointerEvent): void => {
  if (profileRef.value?.contains(event.target as Node)) {
    return;
  }

  isProfileOpen.value = false;
};

/**
 * 按下 Escape 时关闭头像菜单
 *
 * @param event 浏览器键盘事件
 */
const handleDocumentKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    isProfileOpen.value = false;
  }
};

/**
 * 生命周期函数
 */
onMounted(() => {
  isFullscreen.value = Boolean(document.fullscreenElement);
  isDarkTheme.value = document.documentElement.dataset.theme !== 'light';
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('pointerdown', handleDocumentPointerDown);
  document.addEventListener('keydown', handleDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('pointerdown', handleDocumentPointerDown);
  document.removeEventListener('keydown', handleDocumentKeydown);
});
</script>

<style lang="scss" src="./index.scss" scoped></style>
