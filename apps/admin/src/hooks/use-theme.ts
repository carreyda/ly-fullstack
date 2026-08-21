/**
 * 导入全局主题事件总线。
 */
import { emitter } from '@/emitter';

/**
 * 导入主题状态。
 */
import { useThemeStore } from '@/stores';

/**
 * 导入类型声明
 */
import type { ThemeName } from '@/types';

/**
 * 管理后台主题 Hook
 *
 * 统一同步 Pinia 持久状态、根节点 `data-theme` 属性和主题变更事件。组件只能通过该 Hook
 * 主动切换主题，避免 DOM、Store 和需要重建的 WebGL 资源出现状态分叉。
 */
export const useTheme = () => {
  const themeStore = useThemeStore();
  const { themeName } = storeToRefs(themeStore);
  const isDarkTheme = computed(() => themeName.value === 'dark');

  /**
   * 应用指定主题并广播变更通知
   *
   * @param value 需要启用的主题
   */
  const setTheme = (value: ThemeName): void => {
    themeStore.setThemeName(value);
    document.documentElement.dataset.theme = value;
    emitter.emit('EVENT_THEME_CHANGE', value);
  };

  /**
   * 在深色与浅色主题之间切换，并从触发元素中心播放圆形扩散动画
   *
   * 组件点击调用时传入浏览器事件以确定动画起点；没有事件、浏览器不支持 View Transition，
   * 或用户偏好减少动态效果时直接切换主题。
   *
   * @param event 可选的主题切换点击事件
   */
  const toggleTheme = async (event?: MouseEvent): Promise<void> => {
    const nextTheme: ThemeName = themeName.value === 'dark' ? 'light' : 'dark';
    const switchTheme = (): void => {
      setTheme(nextTheme);
    };
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!event || typeof document.startViewTransition !== 'function' || prefersReducedMotion) {
      switchTheme();
      return;
    }

    const triggerRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const originX = triggerRect.left + triggerRect.width / 2;
    const originY = triggerRect.top + triggerRect.height / 2;
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

  document.documentElement.dataset.theme = themeName.value;

  return { themeName, isDarkTheme, setTheme, toggleTheme };
};
