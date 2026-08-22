import type { RouteRecordRaw } from 'vue-router';

/**
 * 组件中心路由树
 */
export const componentCenter: RouteRecordRaw = {
  path: 'component',
  name: 'component',
  redirect: '/component/icon',
  meta: {
    title: '组件中心',
  },
  children: [
    {
      path: 'icon',
      name: 'component-icon',
      component: () => import('@/views/component/icon/index.vue'),
      meta: {
        title: '图标',
        pageBinding: {
          component: 'component/icon/index',
          permissionPrefix: null,
        },
      },
    },
    {
      path: 'video',
      name: 'component-video',
      component: () => import('@/views/component/video/index.vue'),
      meta: {
        title: '视频播放器',
        pageBinding: {
          component: 'component/video/index',
          permissionPrefix: null,
        },
      },
    },
  ],
};
