import type { PaginationParams } from './pagination';

/**
 * 用户列表支持的启用状态筛选值
 */
export type AdminUserStatusFilter = 'ACTIVE' | 'INACTIVE';

/**
 * 用户管理列表查询参数
 */
export interface AdminUserQueryParams extends PaginationParams {
  /**
   * 同时匹配登录名和显示名称的模糊搜索词
   */
  keyword?: string;

  /**
   * 用户启用状态；未传时查询全部状态
   */
  status?: AdminUserStatusFilter;

  /**
   * 只查询绑定指定角色的用户
   */
  roleId?: number;
}

/**
 * 用户列表和角色分配使用的角色摘要
 */
export interface AdminUserRoleSummary {
  /**
   * 角色主键
   */
  id: number;

  /**
   * 角色展示名称
   */
  name: string;

  /**
   * 服务端使用的稳定角色编码
   */
  code: string;
}

/**
 * 用户角色分配下拉框选项
 */
export interface AdminUserRoleOption extends AdminUserRoleSummary {
  /**
   * 角色职责说明
   */
  description: string | null;

  /**
   * 是否允许角色继续参与授权和建立新关联
   */
  isActive: boolean;

  /**
   * 是否为只允许筛选、不允许人工分配的系统角色
   */
  isSystem: boolean;
}

/**
 * 用户管理列表中的单条记录
 */
export interface AdminUserListItem {
  /**
   * 数据库用户主键
   */
  id: number;

  /**
   * 创建后不可修改的登录名
   */
  username: string;

  /**
   * 管理后台展示名称
   */
  displayName: string | null;

  /**
   * 是否允许用户继续登录
   */
  isActive: boolean;

  /**
   * 是否关联系统内置超级管理员角色
   */
  isSystem: boolean;

  /**
   * 当前绑定的角色摘要
   */
  roles: AdminUserRoleSummary[];

  /**
   * 用户创建时间，使用 ISO 字符串跨端传输
   */
  createdAt: string;

  /**
   * 用户最后更新时间，使用 ISO 字符串跨端传输
   */
  updatedAt: string;
}

/**
 * 新增用户请求参数
 */
export interface CreateAdminUserParams {
  /**
   * 创建后不可修改的登录名
   */
  username: string;

  /**
   * 初始登录密码
   */
  password: string;

  /**
   * 管理后台展示名称
   */
  displayName?: string | null;

  /**
   * 是否立即启用用户，默认启用
   */
  isActive?: boolean;
}

/**
 * 编辑用户基础资料请求参数
 */
export interface UpdateAdminUserParams {
  /**
   * 管理后台展示名称
   */
  displayName?: string | null;

  /**
   * 是否允许用户继续登录
   */
  isActive: boolean;
}

/**
 * 替换用户角色请求参数
 */
export interface AssignAdminUserRolesParams {
  /**
   * 用户需要绑定的普通角色主键
   */
  roleIds: number[];
}

/**
 * 管理员重置用户密码请求参数
 */
export interface ResetAdminUserPasswordParams {
  /**
   * 重新生成哈希并覆盖旧密码的新密码
   */
  password: string;
}
