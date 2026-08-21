import type { MenuType } from '../../../generated/prisma/client.js';

/**
 * RBAC 种子脚本使用的菜单树配置
 *
 * 该类型只描述初始化脚本输入，不是浏览器 HTTP 契约，也不会从 database 包公共入口导出。
 */
export interface SeedMenu {
  /**
   * 初始化后在管理端展示的菜单或权限名称
   */
  name: string;

  /**
   * Prisma Schema 定义的目录、页面或按钮类型
   */
  type: MenuType;

  /**
   * 用于幂等更新目录和页面节点的唯一 Vue Router 名称
   */
  routeName?: string;

  /**
   * 管理端页面访问路径；按钮权限节点不需要该字段
   */
  routePath?: string;

  /**
   * Admin 动态路由需要加载的页面组件标识
   */
  component?: string;

  /**
   * 一级导航使用的 Lucide 图标名称
   */
  icon?: string;

  /**
   * 用于幂等更新按钮节点并供前后端鉴权共用的三段式权限码
   */
  permissionCode?: string;

  /**
   * 当前节点在同级菜单中的排序值
   */
  sortOrder: number;

  /**
   * 需要递归初始化的下级菜单和按钮权限
   */
  children?: SeedMenu[];
}
