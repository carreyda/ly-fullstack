import type { RouteRecordRaw } from 'vue-router';

/**
 * 管理后台公开登录路由
 *
 * 登录页必须位于后台 Layout 之外，避免未认证用户看到侧栏和顶栏。路由守卫通过 `meta.public`
 * 识别该入口；已登录用户访问时会回到工作台或 query 中的站内目标页面。
 */
export const auth: RouteRecordRaw = {
  path: '/login',
  name: 'Login',
  component: () => import('@/views/login/index.vue'),
  meta: {
    title: '登录',
    public: true,
  },
};
