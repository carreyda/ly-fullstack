import type { RouteRecordRaw } from 'vue-router';

/**
 * 系统管理路由树
 *
 * 父级路由仅负责形成信息架构和面包屑层级，实际页面由叶子节点按需加载。
 */
export const system: RouteRecordRaw = {
  path: 'system',
  name: 'system',
  redirect: '/system/user',
  meta: {
    title: '系统管理',
  },
  children: [
    {
      path: 'user',
      name: 'system-user',
      component: () => import('@/views/system/user/index.vue'),
      meta: {
        title: '用户管理',
        pageBinding: {
          component: 'system/user/index',
          permissionPrefix: 'system:user',
        },
      },
    },
    {
      path: 'role',
      name: 'system-role',
      component: () => import('@/views/system/role/index.vue'),
      meta: {
        title: '角色管理',
        pageBinding: {
          component: 'system/role/index',
          permissionPrefix: 'system:role',
        },
      },
    },
    {
      path: 'menu',
      name: 'system-menu',
      component: () => import('@/views/system/menu/index.vue'),
      meta: {
        title: '菜单管理',
        pageBinding: {
          component: 'system/menu/index',
          permissionPrefix: 'system:menu',
        },
      },
    },
  ],
};
