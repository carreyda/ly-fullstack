import type { PaginationParams } from './pagination';
import type { RbacMenuType } from './rbac';

/**
 * 角色列表支持的启用状态筛选值
 */
export type AdminRoleStatusFilter = 'ACTIVE' | 'INACTIVE';

/**
 * 角色管理列表查询参数
 */
export interface AdminRoleQueryParams extends PaginationParams {
  /**
   * 同时匹配角色名称和角色编码的模糊搜索词
   */
  keyword?: string;

  /**
   * 角色启用状态；未传时查询全部状态
   */
  status?: AdminRoleStatusFilter;
}

/**
 * 角色管理列表中的单条记录
 */
export interface AdminRoleListItem {
  /**
   * 数据库角色主键
   */
  id: number;

  /**
   * 面向管理员展示的角色名称
   */
  name: string;

  /**
   * 服务端和权限逻辑使用的稳定唯一编码
   */
  code: string;

  /**
   * 角色职责说明；未填写时为空
   */
  description: string | null;

  /**
   * 是否允许该角色继续参与登录会话授权
   */
  isActive: boolean;

  /**
   * 是否为系统内置角色；内置角色禁止编辑和删除
   */
  isSystem: boolean;

  /**
   * 当前绑定该角色的用户数量
   */
  userCount: number;

  /**
   * 当前角色已经关联的菜单和操作权限数量
   */
  menuCount: number;

  /**
   * 角色创建时间，使用 ISO 字符串跨端传输
   */
  createdAt: string;

  /**
   * 角色最后更新时间，使用 ISO 字符串跨端传输
   */
  updatedAt: string;
}

/**
 * 角色编辑与菜单分配使用的完整详情
 */
export interface AdminRoleDetail extends AdminRoleListItem {
  /**
   * 当前角色关联的全部菜单和操作权限主键
   */
  menuIds: number[];
}

/**
 * 新增角色请求参数
 */
export interface CreateAdminRoleParams {
  /**
   * 面向管理员展示的角色名称
   */
  name: string;

  /**
   * 创建后不可修改的稳定角色编码
   */
  code: string;

  /**
   * 角色职责说明
   */
  description?: string | null;

  /**
   * 是否立即启用角色，默认启用
   */
  isActive?: boolean;
}

/**
 * 编辑角色请求参数
 *
 * 角色编码创建后保持稳定，因此编辑接口不接受 `code`。
 */
export interface UpdateAdminRoleParams {
  /**
   * 面向管理员展示的角色名称
   */
  name: string;

  /**
   * 角色职责说明
   */
  description?: string | null;

  /**
   * 是否允许该角色继续参与授权
   */
  isActive: boolean;
}

/**
 * 角色菜单分配请求参数
 */
export interface AssignAdminRoleMenusParams {
  /**
   * 前端权限树选中的菜单、目录和按钮权限主键
   */
  menuIds: number[];
}

/**
 * 角色菜单分配弹框使用的权限树节点
 */
export interface AdminRoleMenuTreeNode {
  /**
   * 菜单或操作权限主键
   */
  id: number;

  /**
   * 父节点主键；根节点为空
   */
  parentId: number | null;

  /**
   * 权限树展示名称
   */
  name: string;

  /**
   * 当前节点属于目录、页面还是按钮权限
   */
  type: RbacMenuType;

  /**
   * 是否可以继续分配当前节点
   */
  isActive: boolean;

  /**
   * 按菜单顺序排列的子节点
   */
  children: AdminRoleMenuTreeNode[];
}
