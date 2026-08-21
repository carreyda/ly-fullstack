import type { MenuType } from '@repo/database';

/**
 * 菜单管理查询层读取的完整数据库记录
 *
 * 该结构只在 Admin API 内部构建管理树，返回浏览器前会映射为 Shared 中的安全契约。
 */
export interface AdminMenuRecord {
  /**
   * 数据库菜单主键
   */
  id: number;

  /**
   * 父节点主键；根节点为空
   */
  parentId: number | null;

  /**
   * 菜单、目录或权限的展示名称
   */
  name: string;

  /**
   * Prisma Schema 定义的节点类型
   */
  type: MenuType;

  /**
   * 页面菜单的浏览器访问地址
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
   * 按钮节点和接口 Guard 共用的权限码
   */
  permissionCode: string | null;

  /**
   * 当前节点在同级中的顺序
   */
  sortOrder: number;

  /**
   * 是否在管理后台导航中展示
   */
  isVisible: boolean;

  /**
   * 是否允许角色继续获得当前节点能力
   */
  isActive: boolean;
}
