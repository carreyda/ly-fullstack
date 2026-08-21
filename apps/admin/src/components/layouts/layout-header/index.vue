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

      <button class="layout-header__action" type="button" aria-label="切换主题" @click="toggleTheme">
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
          <span class="layout-header__avatar">{{ avatarText }}</span>
          <span class="layout-header__profile-name">{{ profileName }}</span>
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
          <button class="layout-header__profile-logout" type="button" role="menuitem" @click="handleLogout">
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
 * Vue 响应式与生命周期能力用于维护面包屑、全屏状态、头像菜单及其浏览器事件清理。
 */
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

/**
 * 路由状态用于生成面包屑，并在退出登录后替换到公开登录页。
 */
import { useRoute, useRouter } from 'vue-router';

/**
 * `storeToRefs` 保留管理员资料从认证 Store 解构后的响应性。
 */
import { storeToRefs } from 'pinia';

/**
 * Lucide 图标承载顶部操作按钮和管理员下拉菜单的统一视觉语言。
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
 * 主题 Hook 统一处理明暗主题状态、持久化与扩散动画。
 */
import { useTheme } from '@/hooks/use-theme';

/**
 * 认证 Store 提供当前管理员资料和退出登录能力。
 */
import { useAuthStore } from '@/stores';

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
 * 引入 hooks
 *
 * 顶栏只消费主题能力，不自行修改根节点主题属性。
 */
const { isDarkTheme, toggleTheme } = useTheme();

/**
 * 引入 store
 *
 * 管理员资料使用 `storeToRefs` 解构，退出方法直接由 Store 实例调用。
 */
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

/**
 * 当前路由用于面包屑，Router 实例用于退出登录后的页面替换。
 */
const route = useRoute();
const router = useRouter();

/**
 * 定义响应式数据
 */
const profileRef = useTemplateRef<HTMLElement>('profileRef');
const isFullscreen = ref(false);
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
 * 计算属性
 * 作用：优先显示管理员资料中的展示名称，未设置时回退到登录名
 */
const profileName = computed(() => user.value?.displayName || user.value?.username || '管理员');

/**
 * 计算属性
 * 作用：从当前展示名称截取两个字符作为无头像时的文字标识
 */
const avatarText = computed(() => profileName.value.trim().slice(0, 2).toUpperCase() || 'LY');

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
 * 处理用户主动退出登录
 *
 * 清空 Auth Store 和 Axios 内存 Token 后使用 replace 返回登录页，避免浏览器后退再次进入需要认证的页面。
 */
const handleLogout = (): void => {
  isProfileOpen.value = false;
  authStore.logout();
  void router.replace({ name: 'Login' });
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
