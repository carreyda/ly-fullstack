import { createRouter, createWebHistory } from 'vue-router';

import pinia, { useAuthStore } from '@/stores';

import { auth } from './modules/auth';
import { componentCenter } from './modules/component-center';
import { dashboard } from './modules/dashboard';
import { display } from './modules/display';
import { notFound } from './modules/not-found';
import { system } from './modules/system';

import type { RouteRecordRaw } from 'vue-router';

/**
 * 管理后台静态路由表
 *
 * 登录页保持在后台 Layout 外；其余页面作为布局子路由聚合，根地址默认进入工作台。
 */
const routes: RouteRecordRaw[] = [
  auth,
  {
    path: '/',
    name: 'AdminLayout',
    component: () => import('@/layouts/index.vue'),
    redirect: '/dashboard',
    children: [dashboard, system, componentCenter, display, notFound],
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
 * 解析登录后的站内回跳地址
 *
 * 只接受以单个 `/` 开头且不是登录页自身的路径，拒绝协议相对地址，防止攻击者借登录流程
 * 把管理员重定向到外部站点。
 *
 * @param value 登录路由 query 中未经信任的 redirect 值
 * @returns 校验后的站内路径；非法或缺失时返回工作台
 */
const resolveInternalRedirect = (value: unknown): string => {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && value !== '/login'
    ? value
    : '/dashboard';
};

/**
 * 登录路由和后台受保护路由之间的统一认证边界
 *
 * 公开登录页不要求 Token；受保护页面必须先存在 Token，并在当前页面生命周期第一次进入时调用
 * `/auth/me` 重新确认数据库中的账号、角色和权限状态。恢复失败会清空持久会话并保留原目标地址，
 * 便于重新登录后返回。
 */
router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia);
  authStore.syncRequestToken();

  if (to.meta.public === true) {
    if (authStore.isAuthenticated) {
      return resolveInternalRedirect(to.query.redirect);
    }

    return true;
  }

  if (!authStore.isAuthenticated) {
    return {
      name: 'Login',
      query: { redirect: to.fullPath },
    };
  }

  if (!authStore.sessionReady) {
    try {
      await authStore.restoreSession();
    } catch {
      authStore.logout();
      return {
        name: 'Login',
        query: { redirect: to.fullPath },
      };
    }
  }

  return true;
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
