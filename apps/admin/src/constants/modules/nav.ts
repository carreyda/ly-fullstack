import type { BaseIconName } from '@/types';

/**
 * 导航叶子节点：直接跳转到指定路径
 */
interface AdminNavLeaf {
  /**
   * 菜单展示文本
   */
  title: string;

  /**
   * 跳转路径
   */
  path: string;

  /**
   * 菜单图标名
   */
  icon: BaseIconName;
}

/**
 * 导航分组节点：展开后显示子菜单
 */
interface AdminNavGroup {
  /**
   * 菜单展示文本
   */
  title: string;

  /**
   * 分组唯一 key，作为 el-menu 的 index 与 default-openeds 值
   */
  key: string;

  /**
   * 菜单图标名
   */
  icon: BaseIconName;

  /**
   * 分组子菜单
   */
  children: AdminNavLeaf[];
}

/**
 * 管理后台导航节点
 *
 * 叶子与分组的区分依赖 `'children' in item`，必须保持联合类型声明，
 * 避免单元素数组被收窄成具体对象后模板判断失效。
 */
export type AdminNavItem = AdminNavLeaf | AdminNavGroup;

/**
 * 管理后台主导航
 *
 * 当前使用静态菜单；后续接入五表 RBAC 后可替换为服务端返回的菜单树。
 * 带 children 的项渲染为分组，分组默认全部展开。
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    title: '工作台',
    path: '/dashboard',
    icon: 'DataBoard',
  },
];
