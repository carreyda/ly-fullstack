import type { Component } from 'vue';
import type { PermissionCode, RbacMenuType } from '@repo/shared/types';

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
 * 菜单管理可以绑定的前端页面注册项
 */
export interface AdminPageOption {
  /**
   * 与菜单表 `routeName` 对应的稳定页面标识
   */
  routeName: string;

  /**
   * 管理员选择页面时看到的业务名称
   */
  title: string;

  /**
   * Vue Router 已经注册的页面地址
   */
  routePath: string;

  /**
   * 用于核对绑定关系的页面组件标识
   */
  component: string;

  /**
   * 可以生成标准 CRUD 权限时使用的两段式前缀
   */
  permissionPrefix: `${string}:${string}` | null;
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
   * 页面注册表使用的稳定标识
   */
  routeName: string | null;

  /**
   * 页面注册表对应的组件标识
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
