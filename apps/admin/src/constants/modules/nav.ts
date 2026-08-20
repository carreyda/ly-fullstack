/**
 * 导入 Vue 类型声明
 */
import type { Component } from 'vue';

/**
 * 导入导航图标组件
 */
import { Boxes, LayoutDashboard, PanelsTopLeft, Settings } from '@lucide/vue';

/**
 * 管理后台导航树节点
 */
export interface AdminNavItem {
  /**
   * 菜单唯一标识
   */
  key: string;

  /**
   * 菜单展示文本
   */
  title: string;

  /**
   * 路由地址
   */
  path?: string;

  /**
   * 顶层菜单使用的 Lucide Vue 图标组件
   */
  icon?: Component;

  /**
   * 子菜单节点
   */
  children?: AdminNavItem[];
}

/**
 * 管理后台主导航
 *
 * 当前只负责展示后台信息架构，叶子节点尚未绑定路由。后续页面落地时再为对应节点补充路由地址，
 * 避免占位菜单跳转到不存在的页面。
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    key: '/dashboard',
    title: '工作台',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'system',
    title: '系统管理',
    icon: Settings,
    children: [
      { key: 'system-user', title: '用户管理' },
      { key: 'system-role', title: '角色管理' },
      { key: 'system-menu', title: '菜单管理' },
    ],
  },
  {
    key: 'component',
    title: '组件中心',
    icon: Boxes,
    children: [
      { key: 'component-icon', title: '图标' },
      { key: 'component-video', title: '视频播放器' },
    ],
  },
  {
    key: 'display',
    title: '展示页面',
    icon: PanelsTopLeft,
    children: [
      { key: 'display-success', title: '成功页' },
      { key: 'display-failure', title: '失败页' },
      { key: 'display-404', title: '404' },
      { key: 'display-500', title: '500' },
    ],
  },
];

/**
 * 默认展开全部导航分组，便于当前阶段直接检查侧栏层级和视觉效果。
 */
export const ADMIN_NAV_DEFAULT_OPENED_KEYS = ADMIN_NAV_ITEMS.filter((item) => item.children?.length).map(
  (item) => item.key,
);
