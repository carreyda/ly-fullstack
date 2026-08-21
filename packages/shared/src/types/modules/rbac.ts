/**
 * RBAC 菜单节点类型
 *
 * `DIRECTORY` 表示只承担分组能力的导航目录，`MENU` 表示可以进入具体页面的导航项，
 * `BUTTON` 表示不进入导航树、只用于控制按钮和 API 的细粒度权限节点。
 */
export type RbacMenuType = 'DIRECTORY' | 'MENU' | 'BUTTON';

/**
 * 前后端共用的 RBAC 权限标识
 *
 * 权限码统一使用 `<模块>:<资源>:<操作>` 三段式结构，例如 `system:user:list`。
 * 该类型保持开放，后续业务模块可以新增权限码，不需要修改 Shared 的字面量联合类型。
 */
export type PermissionCode = `${string}:${string}:${string}`;

/**
 * 管理端可见的菜单树节点。
 */
export interface RbacMenuNode {
  /**
   * 数据库菜单主键，用于角色分配和树节点稳定标识
   */
  id: number;

  /**
   * 后台导航或权限配置树中展示的菜单名称
   */
  name: string;

  /**
   * 当前节点的目录、页面或按钮类型
   */
  type: RbacMenuType;

  /**
   * 页面访问路径；按钮节点和不直接跳转的目录可以为空
   */
  routePath: string | null;

  /**
   * Vue Router 使用的稳定路由名称；按钮节点没有路由名称
   */
  routeName: string | null;

  /**
   * Admin 根据路由加载页面时使用的组件标识；目录和按钮节点为空
   */
  component: string | null;

  /**
   * 一级导航使用的 Lucide 图标名称；没有图标时为空
   */
  icon: string | null;

  /**
   * 按钮和 API Guard 共用的权限码；普通导航节点为空
   */
  permissionCode: PermissionCode | null;

  /**
   * 同级节点排序值，数值越小越靠前
   */
  sortOrder: number;

  /**
   * 当前管理员有权访问的下级导航节点
   */
  children: RbacMenuNode[];
}

/**
 * 当前管理员拥有的角色摘要。
 */
export interface RbacRoleSummary {
  /**
   * 数据库角色主键，用于用户与角色关联
   */
  id: number;

  /**
   * 管理端展示的角色名称
   */
  name: string;

  /**
   * 服务端识别内置角色时使用的稳定唯一编码
   */
  code: string;
}
