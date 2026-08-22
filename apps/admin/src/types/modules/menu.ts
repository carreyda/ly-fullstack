import type { Component } from 'vue';
import type { AdminMenuTreeNode, PermissionCode, RbacMenuType } from '@repo/shared/types';

/**
 * 菜单图标选择器中的图标分类
 */
export type MenuIconCategory =
  | '常用'
  | '用户组织'
  | '权限安全'
  | '数据系统'
  | '文件内容'
  | '业务管理'
  | '财务统计'
  | '消息通知'
  | '时间任务'
  | '状态工具';

/**
 * 菜单图标白名单中的单个可选项
 */
export interface MenuIconOption {
  /**
   * 写入菜单表并用于组件解析的 Lucide 导出名称
   */
  name: string;

  /**
   * 图标选择器展示的中文名称
   */
  label: string;

  /**
   * 图标所属的后台业务场景分类
   */
  category: MenuIconCategory;

  /**
   * 图标搜索使用的中文或英文补充关键词
   */
  keywords: string;

  /**
   * 从 `@lucide/vue` 显式导入的 Vue 图标组件
   */
  component: Component;
}

/**
 * 管理后台侧栏使用的导航视图节点
 */
export interface AdminNavItem {
  /**
   * Element Plus Menu 使用的唯一标识
   */
  key: string;

  /**
   * 菜单展示文本
   */
  title: string;

  /**
   * 页面节点对应的路由地址
   */
  path?: string;

  /**
   * 顶层菜单使用的 Lucide Vue 图标组件
   */
  icon?: Component;

  /**
   * 当前管理员有权访问的子菜单节点
   */
  children?: AdminNavItem[];
}

/**
 * 菜单属性面板使用的完整可编辑模型
 */
export interface AdminMenuEditorModel {
  /**
   * 编辑已有节点时的数据库主键；新增时为空
   */
  id?: number;

  /**
   * 父节点主键；根节点为空
   */
  parentId: number | null;

  /**
   * 菜单、目录或权限的展示名称
   */
  name: string;

  /**
   * 当前编辑的节点类型
   */
  type: RbacMenuType;

  /**
   * 页面菜单对应的浏览器访问地址
   */
  routePath: string | null;

  /**
   * Router 页面绑定元数据使用的稳定标识
   */
  routeName: string | null;

  /**
   * Router 页面绑定元数据对应的组件标识
   */
  component: string | null;

  /**
   * 一级导航使用的 Lucide 图标名称
   */
  icon: string | null;

  /**
   * 按钮节点使用的三段式权限码
   */
  permissionCode: PermissionCode | null;

  /**
   * 是否在管理后台导航中展示
   */
  isVisible: boolean;

  /**
   * 是否启用当前节点
   */
  isActive: boolean;
}

/**
 * 菜单树发起新增操作时提供的父级和节点类型
 */
export interface AdminMenuCreateContext {
  /**
   * 新节点需要归属的父菜单主键；根节点为空
   */
  parentId: number | null;

  /**
   * 用户在快捷菜单中选择的新节点类型
   */
  type: Exclude<RbacMenuType, 'BUTTON'>;
}

/**
 * 菜单父级选择器使用的扁平选项
 */
export interface ParentMenuOption {
  /**
   * 菜单主键
   */
  id: number;

  /**
   * 包含层级缩进的菜单名称
   */
  label: string;
}

/**
 * 菜单编辑表单暴露的最小校验能力
 */
export interface MenuFormExpose {
  /**
   * 执行当前表单的全部校验规则
   */
  validate: () => Promise<boolean>;
}

/**
 * 菜单树附加图标和类型文案后的视图节点
 */
export interface MenuTreeViewNode extends Omit<AdminMenuTreeNode, 'children'> {
  /**
   * 一级菜单对应的 Lucide Vue 组件
   */
  iconComponent?: Component;

  /**
   * 当前节点类型的中文名称
   */
  typeLabel: string;

  /**
   * 不包含按钮权限的下级导航节点
   */
  children: MenuTreeViewNode[];
}

/**
 * 菜单树组件暴露的筛选能力
 */
export interface MenuTreeExpose {
  /**
   * 使用当前搜索值重新筛选树节点
   */
  filter: (value: string) => void;
}
