import type { AdminUserQueryParams, CreateAdminUserParams } from '@repo/shared/types';

import type { DataFilterModel, OperationType } from './base';

/**
 * 用户管理页面的分页筛选模型
 *
 * 与 Shared 查询契约保持一致，并补充筛选面板需要的字符串索引能力。
 */
export type AdminUserFilterModel = AdminUserQueryParams & DataFilterModel;

/**
 * 用户新增与编辑弹框使用的表单模型
 */
export interface AdminUserFormModel extends Omit<Required<CreateAdminUserParams>, 'displayName'> {
  /**
   * 管理后台展示名称；表单使用空字符串表示未填写
   */
  displayName: string;
}

/**
 * 用户密码重置弹框使用的表单模型
 */
export interface AdminUserPasswordFormModel {
  /**
   * 新密码
   */
  password: string;

  /**
   * 再次输入的新密码，只参与浏览器校验
   */
  confirmPassword: string;
}

/**
 * 用户表单 Composable 的页面回调参数
 */
export interface UseUserFormOptions {
  /**
   * 用户保存成功后的页面回调
   */
  onSuccess: (operationType: OperationType) => void;
}

/**
 * 用户角色分配 Composable 的页面回调参数
 */
export interface UseUserRoleOptions {
  /**
   * 用户角色保存成功后的页面回调
   */
  onSuccess: () => void;
}
