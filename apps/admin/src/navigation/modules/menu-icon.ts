import { MENU_ICON_OPTIONS } from './menu-icons';

import type { Component } from 'vue';

/**
 * 菜单图标名称到 Vue 组件的解析表
 */
const MENU_ICON_COMPONENTS = new Map<string, Component>(
  MENU_ICON_OPTIONS.map((option) => [option.name, option.component]),
);

/**
 * 解析数据库菜单保存的 Lucide 图标名称
 *
 * @param name 菜单表中的图标名称
 * @returns 白名单中的 Vue 图标组件；名称为空或已移除时返回 `undefined`
 */
export const resolveMenuIcon = (name: string | null | undefined): Component | undefined => {
  return name ? MENU_ICON_COMPONENTS.get(name) : undefined;
};
