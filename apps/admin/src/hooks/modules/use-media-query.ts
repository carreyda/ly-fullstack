import { onMounted, onUnmounted, ref } from 'vue';

import type { Ref } from 'vue';

/**
 * 响应式媒体查询 Hook
 *
 * 返回的布尔状态随媒体查询条件变化自动更新；监听器在组件卸载时移除，避免跨页面残留。
 *
 * @param query 标准媒体查询字符串，例如 `(max-width: 1024px)`
 * @returns 当前是否匹配查询条件
 */
export const useMediaQuery = (query: string): Ref<boolean> => {
  const matches = ref(false);

  let mediaQueryList: MediaQueryList | null = null;
  const handleChange = (event: MediaQueryListEvent): void => {
    matches.value = event.matches;
  };

  onMounted(() => {
    mediaQueryList = window.matchMedia(query);
    matches.value = mediaQueryList.matches;
    mediaQueryList.addEventListener('change', handleChange);
  });

  onUnmounted(() => {
    mediaQueryList?.removeEventListener('change', handleChange);
  });

  return matches;
};
