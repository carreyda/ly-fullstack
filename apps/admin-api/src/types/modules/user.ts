/**
 * 用户列表查询读取的数据库角色记录
 */
export interface AdminUserRoleRecord {
  /**
   * 角色主键
   */
  id: number;

  /**
   * 角色展示名称
   */
  name: string;

  /**
   * 稳定角色编码
   */
  code: string;
}

/**
 * 用户列表查询读取的数据库记录
 */
export interface AdminUserRecord {
  /**
   * 用户主键
   */
  id: number;

  /**
   * 登录名
   */
  username: string;

  /**
   * 展示名称
   */
  displayName: string | null;

  /**
   * 是否允许登录
   */
  isActive: boolean;

  /**
   * 用户创建时间
   */
  createdAt: Date;

  /**
   * 用户最后更新时间
   */
  updatedAt: Date;

  /**
   * 用户角色关联记录
   */
  roles: Array<{
    /**
     * 关联角色
     */
    role: AdminUserRoleRecord;
  }>;
}
