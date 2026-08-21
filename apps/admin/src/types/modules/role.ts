import type { AdminRoleMenuTreeNode, AdminRoleQueryParams, CreateAdminRoleParams } from '@repo/shared/types';

import type { DataFilterModel } from './base';

/**
 * 角色管理页面的分页筛选模型
 *
 * 与 Shared 查询契约保持一致，并补充筛选面板需要的字符串索引能力。
 */
export type AdminRoleFilterModel = AdminRoleQueryParams & DataFilterModel;

/**
 * 角色新增与编辑弹框使用的表单模型
 */
export interface AdminRoleFormModel extends Required<Omit<CreateAdminRoleParams, 'description'>> {
  /**
   * 角色职责说明；表单使用空字符串表示未填写
   */
  description: string;
}

/**
 * 角色菜单弹框渲染的权限树节点
 *
 * `disabled` 由后端 `isActive` 状态派生，只服务于 Element Plus Tree 展示，不进入接口参数。
 */
export interface AdminRoleMenuTreeViewNode extends AdminRoleMenuTreeNode {
  /**
   * 停用节点不允许重新分配
   */
  disabled: boolean;

  /**
   * 递归转换后的子节点
   */
  children: AdminRoleMenuTreeViewNode[];
}
