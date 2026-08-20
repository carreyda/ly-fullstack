import { createRouter, createWebHistory } from 'vue-router';

import { dashboard } from './modules/dashboard';
import { notFound } from './modules/not-found';

import type { RouteRecordRaw } from 'vue-router';

/**
 * 管理后台静态路由表
 *
 * 后台页面作为布局子路由聚合，根地址默认进入工作台；本阶段未接入认证，
 * 不存在登录页与路由守卫的鉴权跳转，下一阶段认证落地后补齐。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/',
    name: 'AdminLayout',
    component: () => import('@/layouts/index.vue'),
    redirect: '/dashboard',
    children: [dashboard, notFound],
  },
];

/**
 * 管理后台 Router 实例，当前部署在站点根路径并使用 HTML5 history。
 */
const router = createRouter({
  history: createWebHistory(),
  routes,
});

/**
 * 同步浏览器标签标题，与侧栏选中态、页面内容保持同源
 */
router.afterEach((to) => {
  if (typeof to.meta.title === 'string') {
    document.title = `${to.meta.title} - LY Fullstack Admin`;
  }
});

/**
 * 兼容部署后旧页面仍引用历史异步 chunk 的场景
 *
 * 仅在浏览器明确报告动态模块加载失败时刷新页面，以重新获取最新 HTML 和资源映射；
 * 其他路由错误继续交给 Vue Router 和调用方处理，避免无条件刷新掩盖真实异常。
 */
router.onError((error) => {
  const message = error.message || '';
  if (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed')
  ) {
    window.location.reload();
  }
});

export default router;
