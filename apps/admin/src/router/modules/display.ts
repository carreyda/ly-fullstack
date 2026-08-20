import type { RouteRecordRaw } from 'vue-router';

/**
 * 展示页面路由树
 */
export const display: RouteRecordRaw = {
  path: 'display',
  name: 'Display',
  redirect: '/display/success',
  meta: {
    title: '展示页面',
  },
  children: [
    {
      path: 'success',
      name: 'DisplaySuccess',
      component: () => import('@/views/display/success/index.vue'),
      meta: {
        title: '成功页',
      },
    },
    {
      path: 'failure',
      name: 'DisplayFailure',
      component: () => import('@/views/display/failure/index.vue'),
      meta: {
        title: '失败页',
      },
    },
    {
      path: '404',
      name: 'Display404',
      component: () => import('@/views/display/404/index.vue'),
      meta: {
        title: '404',
      },
    },
    {
      path: '500',
      name: 'Display500',
      component: () => import('@/views/display/500/index.vue'),
      meta: {
        title: '500',
      },
    },
  ],
};
