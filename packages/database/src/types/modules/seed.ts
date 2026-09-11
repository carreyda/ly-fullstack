import type { MenuType } from '../../../generated/prisma/client.js';

/**
 * RBAC 菜单种子配置的公共字段
 */
interface SeedMenuBase {
  /**
   * 初始化后在管理端展示的菜单或权限名称
   */
  name: string;

  /**
   * 当前节点在同级菜单中的排序值
   */
  sortOrder: number;
}

/**
 * 目录或页面菜单的种子配置
 *
 * 导航节点必须提供稳定的 Router 名称，用于重复执行 Seed 时幂等更新；权限码只属于按钮节点。
 */
export interface SeedNavigationMenu extends SeedMenuBase {
  /**
   * Prisma Schema 定义的目录或页面类型
   */
  type: Exclude<MenuType, 'BUTTON'>;

  /**
   * 用于幂等更新目录和页面节点的唯一 Vue Router 名称
   */
  routeName: string;

  /**
   * 管理端页面访问路径
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
   * 需要递归初始化的下级菜单和按钮权限
   */
  children?: SeedMenu[];

  /**
   * 导航节点禁止携带按钮权限码
   */
  permissionCode?: never;
}

/**
 * 按钮权限节点的种子配置
 *
 * 按钮节点必须提供权限码作为幂等键，不参与 Router 导航，也不能继续包含子节点。
 */
export interface SeedPermissionMenu extends SeedMenuBase {
  /**
   * Prisma Schema 定义的按钮类型
   */
  type: Extract<MenuType, 'BUTTON'>;

  /**
   * 用于幂等更新按钮节点并供前后端鉴权共用的三段式权限码
   */
  permissionCode: string;

  /**
   * 按钮节点禁止绑定 Router 名称
   */
  routeName?: never;

  /**
   * 按钮节点禁止配置导航路径
   */
  routePath?: never;

  /**
   * 按钮节点禁止绑定页面组件
   */
  component?: never;

  /**
   * 按钮节点禁止配置侧边栏图标
   */
  icon?: never;

  /**
   * 按钮节点不能继续包含子节点
   */
  children?: never;
}

/**
 * RBAC 种子脚本使用的菜单树配置
 *
 * 该类型只描述初始化脚本输入，不是浏览器 HTTP 契约，也不会从 database 包公共入口导出。
 */
export type SeedMenu = SeedNavigationMenu | SeedPermissionMenu;
