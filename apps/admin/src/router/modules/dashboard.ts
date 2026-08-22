import type { RouteRecordRaw } from 'vue-router';

/**
 * 管理后台工作台路由
 *
 * 作为主布局的子路由使用，因此路径保持相对形式；页面组件按路由懒加载，避免首屏提前请求页面内容。
 */
export const dashboard: RouteRecordRaw = {
  path: 'dashboard',
  name: 'dashboard',
  component: () => import('@/views/dashboard/index.vue'),
  meta: {
    title: '工作台',
    pageBinding: {
      component: 'dashboard/index',
      permissionPrefix: null,
    },
  },
};
