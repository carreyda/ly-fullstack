import type { ThemeName } from './base';

/**
 * 管理后台 mitt 全局事件映射
 *
 * 这里只定义无法通过组件 Props、Emits 或 Pinia 状态自然表达的跨模块通知。
 */
export type AdminEmitterEvents = {
  /**
   * 主题切换完成后派发的新主题名称
   *
   * 派发方：`use-theme.ts`。
   * 监听方：需要按主题重建 WebGL 等外部资源的组件。
   */
  EVENT_THEME_CHANGE: ThemeName;

  /**
   * 管理 API 返回非登录接口的 401 后派发
   *
   * 派发方：`service-base-interceptor.ts`。
   * 监听方：`main.ts`，负责清除 Auth Store 并跳转登录页。
   */
  EVENT_AUTH_UNAUTHORIZED: undefined;
};
