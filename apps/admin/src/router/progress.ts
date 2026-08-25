import { BProgress } from '@bprogress/core';

import type { Router } from 'vue-router';

/**
 * 为路由实例装配页面切换进度条
 *
 * 每次导航启动顶部进度条,导航确认或失败时结束。进度条覆盖两类真实耗时:首次进入
 * 页面时的异步 chunk 加载,以及登录后首次导航触发的会话恢复请求。右上角旋转图标
 * 与后台整体视觉语言不符,只保留顶部细进度条;颜色由 `progress.scss` 接入设计
 * token,跟随深浅主题切换。
 *
 * 该方法必须在认证守卫注册之前调用,保证耗时守卫执行期间进度条已经可见。
 *
 * @param router 管理后台 Router 实例
 */
export const setupRouterProgress = (router: Router): void => {
  BProgress.configure({ showSpinner: false });

  router.beforeEach(() => {
    BProgress.start();
  });

  router.afterEach(() => {
    BProgress.done();
  });

  router.onError(() => {
    BProgress.done();
  });
};
