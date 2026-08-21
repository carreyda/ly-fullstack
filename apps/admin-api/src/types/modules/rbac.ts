import type { MenuType } from '@repo/database';

/**
 * RBAC 查询层从 Prisma 读取的菜单记录
 *
 * 该结构包含构建导航树和权限集合所需的数据库字段，只在 Admin API 内部使用，
 * 对外响应会映射为 Shared 中不包含数据库实现细节的 `RbacMenuNode`。
 */
export interface RbacAccessMenuRecord {
  /**
   * 数据库菜单主键
   */
  id: number;

  /**
   * 父菜单主键，根节点为空
   */
  parentId: number | null;

  /**
   * 管理端展示的菜单名称
   */
  name: string;

  /**
   * Prisma Schema 定义的目录、页面或按钮类型
   */
  type: MenuType;

  /**
   * 页面访问路径，按钮节点可以为空
   */
  routePath: string | null;

  /**
   * Vue Router 使用的稳定路由名称
   */
  routeName: string | null;

  /**
   * Admin 页面组件标识
   */
  component: string | null;

  /**
   * 一级菜单使用的 Lucide 图标名称
   */
  icon: string | null;

  /**
   * 按钮节点和 API Guard 共用的权限码
   */
  permissionCode: string | null;

  /**
   * 同级节点排序值
   */
  sortOrder: number;

  /**
   * 当前节点是否允许进入管理端导航树
   */
  isVisible: boolean;
}
