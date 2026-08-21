import type { Component } from 'vue';
import type { RbacMenuNode } from '@repo/shared/types';

import { resolveMenuIcon } from './menu-icons';

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
 * 把当前管理员的数据库菜单树转换为侧栏渲染模型
 *
 * 页面组件仍由本地 Vue Router 注册，数据库只决定当前管理员可以看到的层级、名称、顺序和图标。
 * 一级节点解析 Lucide 图标，二级及更深层级保持纯文本展示。
 *
 * @param menus 登录会话返回的可见菜单树
 * @param root 当前是否处于导航树根层级
 * @returns Element Plus 侧栏使用的导航节点
 */
export const createAdminNavItems = (menus: RbacMenuNode[], root = true): AdminNavItem[] => {
  return menus.map((menu) => ({
    key: menu.routePath ?? `menu-${menu.id}`,
    title: menu.name,
    path: menu.type === 'MENU' ? (menu.routePath ?? undefined) : undefined,
    icon: root ? resolveMenuIcon(menu.icon) : undefined,
    children: menu.children.length ? createAdminNavItems(menu.children, false) : undefined,
  }));
};

/**
 * 获取默认展开的全部导航分组
 *
 * @param items 当前管理员的侧栏导航树
 * @returns 拥有子节点的菜单键
 */
export const createAdminNavDefaultOpenedKeys = (items: AdminNavItem[]): string[] => {
  return items.filter((item) => item.children?.length).map((item) => item.key);
};
