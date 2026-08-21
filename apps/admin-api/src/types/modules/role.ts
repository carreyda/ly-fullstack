import type { MenuType } from '@repo/database';

/**
 * 角色列表查询读取的数据库记录
 */
export interface AdminRoleRecord {
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

  /**
   * 角色职责说明
   */
  description: string | null;

  /**
   * 是否参与会话授权
   */
  isActive: boolean;

  /**
   * 角色创建时间
   */
  createdAt: Date;

  /**
   * 角色最后更新时间
   */
  updatedAt: Date;

  /**
   * 角色关联数量统计
   */
  _count: {
    /**
     * 已绑定用户数量
     */
    users: number;

    /**
     * 已绑定菜单与操作权限数量
     */
    menus: number;
  };
}

/**
 * 角色详情查询读取的数据库记录
 */
export interface AdminRoleDetailRecord extends AdminRoleRecord {
  /**
   * 当前角色的菜单关联记录
   */
  menus: Array<{
    /**
     * 已关联菜单主键
     */
    menuId: number;
  }>;
}

/**
 * 角色菜单分配树读取的数据库记录
 */
export interface AdminRoleMenuRecord {
  /**
   * 菜单主键
   */
  id: number;

  /**
   * 父菜单主键
   */
  parentId: number | null;

  /**
   * 菜单或权限展示名称
   */
  name: string;

  /**
   * 目录、页面或按钮权限类型
   */
  type: MenuType;

  /**
   * 是否允许继续分配
   */
  isActive: boolean;

  /**
   * 当前节点的同级顺序
   */
  sortOrder: number;
}
