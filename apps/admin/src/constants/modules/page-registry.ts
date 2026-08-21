import type { AdminPageOption } from '@/types';

/**
 * 菜单管理可以绑定的前端页面注册表
 *
 * 菜单录入只选择已经存在的页面，不允许管理员手填 Vue 文件路径。`routeName` 与数据库种子保持一致，
 * `component` 只用于保存和核对绑定关系，实际组件加载仍由 Vue Router 静态模块负责。
 */
export const ADMIN_PAGE_OPTIONS: readonly AdminPageOption[] = [
  {
    routeName: 'dashboard',
    title: '工作台',
    routePath: '/dashboard',
    component: 'dashboard/index',
    permissionPrefix: null,
  },
  {
    routeName: 'system-user',
    title: '用户管理',
    routePath: '/system/user',
    component: 'system/user/index',
    permissionPrefix: 'system:user',
  },
  {
    routeName: 'system-role',
    title: '角色管理',
    routePath: '/system/role',
    component: 'system/role/index',
    permissionPrefix: 'system:role',
  },
  {
    routeName: 'system-menu',
    title: '菜单管理',
    routePath: '/system/menu',
    component: 'system/menu/index',
    permissionPrefix: 'system:menu',
  },
  {
    routeName: 'component-icon',
    title: '图标',
    routePath: '/component/icon',
    component: 'component/icon/index',
    permissionPrefix: null,
  },
  {
    routeName: 'component-video',
    title: '视频播放器',
    routePath: '/component/video',
    component: 'component/video/index',
    permissionPrefix: null,
  },
  {
    routeName: 'display-success',
    title: '成功页',
    routePath: '/display/success',
    component: 'display/success/index',
    permissionPrefix: null,
  },
  {
    routeName: 'display-failure',
    title: '失败页',
    routePath: '/display/failure',
    component: 'display/failure/index',
    permissionPrefix: null,
  },
  {
    routeName: 'display-404',
    title: '404',
    routePath: '/display/404',
    component: 'display/404/index',
    permissionPrefix: null,
  },
  {
    routeName: 'display-500',
    title: '500',
    routePath: '/display/500',
    component: 'display/500/index',
    permissionPrefix: null,
  },
];
