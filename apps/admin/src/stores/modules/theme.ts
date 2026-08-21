import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { ThemeName } from '@/types';

/**
 * 管理后台主题 Store
 *
 * 主题名称是跨页面持久状态，由 Store 作为唯一真相源。根节点属性更新和主题事件广播由
 * `use-theme` Hook 负责，Store 不直接操作 DOM，也不依赖事件总线。
 */
export const useThemeStore = defineStore(
  'theme',
  () => {
    /**
     * 当前启用的主题名称，由持久化插件写入浏览器本地存储。
     */
    const themeName = ref<ThemeName>('dark');

    /**
     * 更新当前主题名称
     *
     * 触发时机：`useTheme` 应用指定主题或执行明暗主题切换时。
     * 副作用：更新 Pinia 状态并触发持久化插件写入；DOM 属性和全局事件仍由 `useTheme` 负责。
     *
     * @param value 需要启用的主题
     */
    const setThemeName = (value: ThemeName): void => {
      themeName.value = value;
    };

    return { themeName, setThemeName };
  },
  {
    persist: {
      key: 'APP_PINIA_THEME',
      pick: ['themeName'],
    },
  },
);
