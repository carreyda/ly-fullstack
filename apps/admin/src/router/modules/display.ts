import type { RouteRecordRaw } from 'vue-router';

/**
 * 展示页面路由树
 */
export const display: RouteRecordRaw = {
  path: 'display',
  name: 'display',
  redirect: '/display/success',
  meta: {
    title: '展示页面',
  },
  children: [
    {
      path: 'success',
      name: 'display-success',
      component: () => import('@/views/display/success/index.vue'),
      meta: {
        title: '成功页',
        pageBinding: {
          component: 'display/success/index',
          permissionPrefix: null,
        },
      },
    },
    {
      path: 'failure',
      name: 'display-failure',
      component: () => import('@/views/display/failure/index.vue'),
      meta: {
        title: '失败页',
        pageBinding: {
          component: 'display/failure/index',
          permissionPrefix: null,
        },
      },
    },
    {
      path: '404',
      name: 'display-404',
      component: () => import('@/views/display/404/index.vue'),
      meta: {
        title: '404',
        pageBinding: {
          component: 'display/404/index',
          permissionPrefix: null,
        },
      },
    },
    {
      path: '500',
      name: 'display-500',
      component: () => import('@/views/display/500/index.vue'),
      meta: {
        title: '500',
        pageBinding: {
          component: 'display/500/index',
          permissionPrefix: null,
        },
      },
    },
  ],
};
