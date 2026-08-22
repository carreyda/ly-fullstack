import type { Component } from 'vue';

/**
 * 图标展示项。
 */
export interface AdminIconItem {
  /**
   * Lucide 组件导出名称。
   */
  name: string;

  /**
   * 图标的中文用途说明。
   */
  label: string;

  /**
   * 实际渲染的 Lucide Vue 组件。
   */
  icon: Component;
}

/**
 * 图标展示分类。
 */
export interface AdminIconCategory {
  /**
   * 分类稳定标识。
   */
  key: string;

  /**
   * 分类名称。
   */
  label: string;

  /**
   * 分类用途说明。
   */
  description: string;

  /**
   * 当前分类展示的图标集合。
   */
  iconList: AdminIconItem[];
}
