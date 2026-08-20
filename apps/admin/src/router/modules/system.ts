import type { RouteRecordRaw } from 'vue-router';

/**
 * 系统管理路由树
 *
 * 父级路由仅负责形成信息架构和面包屑层级，实际页面由叶子节点按需加载。
 */
export const system: RouteRecordRaw = {
  path: 'system',
  name: 'System',
  redirect: '/system/user',
  meta: {
    title: '系统管理',
  },
  children: [
    {
      path: 'user',
      name: 'SystemUser',
      component: () => import('@/views/system/user/index.vue'),
      meta: {
        title: '用户管理',
      },
    },
    {
      path: 'role',
      name: 'SystemRole',
      component: () => import('@/views/system/role/index.vue'),
      meta: {
        title: '角色管理',
      },
    },
    {
      path: 'menu',
      name: 'SystemMenu',
      component: () => import('@/views/system/menu/index.vue'),
      meta: {
        title: '菜单管理',
      },
    },
  ],
};
