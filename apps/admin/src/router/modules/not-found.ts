import type { RouteRecordRaw } from 'vue-router';

/**
 * 管理后台 404 兜底路由
 *
 * 挂在主布局下使用 `pathMatch` 捕获全部未匹配地址，并复用展示模块已经完成的 404 页面，
 * 保持侧栏与顶栏可用，用户可直接返回工作台。
 */
export const notFound: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('@/views/display/404/index.vue'),
  meta: {
    title: '页面不存在',
  },
};
