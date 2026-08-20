/**
 * 导入 Vue 类型声明
 */
import type { Component } from 'vue';

/**
 * 导入导航图标组件
 */
import {
  BadgeCheck,
  Boxes,
  CirclePlay,
  CircleX,
  FileQuestion,
  Grid2X2,
  LayoutDashboard,
  ListTree,
  PanelsTopLeft,
  ServerCrash,
  Settings,
  ShieldCheck,
  Users,
} from '@lucide/vue';

/**
 * 导航叶子节点
 */
interface AdminNavLeaf {
  /**
   * 菜单唯一标识
   */
  key: string;

  /**
   * 菜单展示文本
   */
  title: string;

  /**
   * Lucide Vue 图标组件
   */
  icon: Component;
}

/**
 * 顶层工作台菜单
 *
 * 工作台是进入后台后的首页，不归属于任何业务分组，直接复用现有 dashboard 路由。
 */
export const ADMIN_NAV_HOME = {
  key: '/dashboard',
  title: '工作台',
  path: '/dashboard',
  icon: LayoutDashboard,
};

/**
 * 导航分组节点
 */
interface AdminNavGroup {
  /**
   * 分组唯一标识
   */
  key: string;

  /**
   * 分组展示文本
   */
  title: string;

  /**
   * Lucide Vue 图标组件
   */
  icon: Component;

  /**
   * 分组子菜单
   */
  children: AdminNavLeaf[];
}

/**
 * 管理后台主导航
 *
 * 当前只负责展示后台信息架构，叶子节点尚未绑定路由。后续页面落地时再为对应节点补充路由地址，
 * 避免占位菜单跳转到不存在的页面。
 */
export const ADMIN_NAV_ITEMS: AdminNavGroup[] = [
  {
    key: 'system',
    title: '系统管理',
    icon: Settings,
    children: [
      { key: 'system-user', title: '用户管理', icon: Users },
      { key: 'system-role', title: '角色管理', icon: ShieldCheck },
      { key: 'system-menu', title: '菜单管理', icon: ListTree },
    ],
  },
  {
    key: 'component',
    title: '组件中心',
    icon: Boxes,
    children: [
      { key: 'component-icon', title: '图标', icon: Grid2X2 },
      { key: 'component-video', title: '视频播放器', icon: CirclePlay },
    ],
  },
  {
    key: 'display',
    title: '展示页面',
    icon: PanelsTopLeft,
    children: [
      { key: 'display-success', title: '成功页', icon: BadgeCheck },
      { key: 'display-failure', title: '失败页', icon: CircleX },
      { key: 'display-404', title: '404', icon: FileQuestion },
      { key: 'display-500', title: '500', icon: ServerCrash },
    ],
  },
];

/**
 * 默认展开全部导航分组，便于当前阶段直接检查侧栏层级和视觉效果。
 */
export const ADMIN_NAV_DEFAULT_OPENED_KEYS = ADMIN_NAV_ITEMS.map((item) => item.key);
