import type { PermissionCode, RbacMenuType } from './rbac';

/**
 * 菜单管理页面使用的完整树节点
 *
 * 与登录会话中的可见导航不同，该结构同时包含隐藏、停用和按钮权限节点，供管理员维护完整 RBAC
 * 菜单树。Prisma 记录必须先映射为该安全契约，不能直接暴露数据库生成类型。
 */
export interface AdminMenuTreeNode {
  /**
   * 数据库菜单主键，用于编辑、删除和拖拽排序
   */
  id: number;

  /**
   * 父节点主键；根节点为空
   */
  parentId: number | null;

  /**
   * 菜单、目录或操作权限的展示名称
   */
  name: string;

  /**
   * 当前节点属于目录、页面菜单或按钮权限
   */
  type: RbacMenuType;

  /**
   * 页面菜单对应的浏览器访问地址
   */
  routePath: string | null;

  /**
   * 前端 Router 使用的稳定页面标识
   */
  routeName: string | null;

  /**
   * 前端 Router 页面绑定元数据中的组件标识，只用于核对绑定关系
   */
  component: string | null;

  /**
   * 一级导航使用的 Lucide 图标名称
   */
  icon: string | null;

  /**
   * 按钮节点和后端 Guard 共用的三段式权限码
   */
  permissionCode: PermissionCode | null;

  /**
   * 当前节点在同级中的顺序，数值越小越靠前
   */
  sortOrder: number;

  /**
   * 是否在管理后台导航中展示；按钮节点固定为不展示
   */
  isVisible: boolean;

  /**
   * 是否允许角色继续获得当前节点对应的访问能力
   */
  isActive: boolean;

  /**
   * 按同级顺序排列的下级目录、菜单或权限节点
   */
  children: AdminMenuTreeNode[];
}

/**
 * 新增菜单节点的请求参数
 */
export interface CreateAdminMenuParams {
  /**
   * 父节点主键；新增根节点时为空
   */
  parentId?: number | null;

  /**
   * 菜单、目录或权限的展示名称
   */
  name: string;

  /**
   * 需要创建的节点类型
   */
  type: RbacMenuType;

  /**
   * 前端 Router 提供的访问地址
   */
  routePath?: string | null;

  /**
   * 前端 Router 提供的稳定页面标识
   */
  routeName?: string | null;

  /**
   * 前端 Router 页面绑定元数据提供的组件标识
   */
  component?: string | null;

  /**
   * 一级导航选中的 Lucide 图标名称
   */
  icon?: string | null;

  /**
   * 按钮节点使用的三段式权限码
   */
  permissionCode?: PermissionCode | null;

  /**
   * 是否在管理后台导航中展示
   */
  isVisible?: boolean;

  /**
   * 是否启用当前节点
   */
  isActive?: boolean;
}

/**
 * 编辑菜单节点的请求参数
 *
 * 编辑接口使用完整表单提交，确保节点类型变化后由服务端统一清理不再适用的字段。
 */
export type UpdateAdminMenuParams = CreateAdminMenuParams;

/**
 * 单个菜单节点的拖拽排序结果
 */
export interface AdminMenuReorderItem {
  /**
   * 被移动或重新排序的菜单主键
   */
  id: number;

  /**
   * 拖拽完成后的父节点主键；根节点为空
   */
  parentId: number | null;

  /**
   * 拖拽完成后的同级顺序，从零开始连续编号
   */
  sortOrder: number;
}

/**
 * 批量保存菜单树顺序的请求参数
 */
export interface ReorderAdminMenusParams {
  /**
   * 当前导航树中全部非按钮节点的最终父级和顺序快照
   */
  items: AdminMenuReorderItem[];
}

/**
 * 为页面菜单生成标准 CRUD 权限的请求参数
 */
export interface CreateStandardMenuPermissionsParams {
  /**
   * 两段式权限前缀，例如 `system:user`
   */
  permissionPrefix: `${string}:${string}`;
}

/**
 * 标准 CRUD 权限批量创建结果
 */
export interface CreateStandardMenuPermissionsResult {
  /**
   * 本次实际新增的权限节点数量；已存在的权限不会重复创建
   */
  createdCount: number;
}
