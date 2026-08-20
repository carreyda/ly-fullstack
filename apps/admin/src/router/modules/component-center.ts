import type { RouteRecordRaw } from 'vue-router';

/**
 * 组件中心路由树
 */
export const componentCenter: RouteRecordRaw = {
  path: 'component',
  name: 'ComponentCenter',
  redirect: '/component/icon',
  meta: {
    title: '组件中心',
  },
  children: [
    {
      path: 'icon',
      name: 'ComponentIcon',
      component: () => import('@/views/component/icon/index.vue'),
      meta: {
        title: '图标',
      },
    },
    {
      path: 'video',
      name: 'ComponentVideo',
      component: () => import('@/views/component/video/index.vue'),
      meta: {
        title: '视频播放器',
      },
    },
  ],
};
