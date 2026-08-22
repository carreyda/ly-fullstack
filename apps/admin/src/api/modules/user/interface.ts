import { serviceBase } from '@/services/service-base';

import {
  API_ADMIN_USERS,
  API_ADMIN_USER_ROLE_OPTIONS,
  getAdminUserApi,
  getAdminUserPasswordApi,
  getAdminUserRolesApi,
} from './api';

import type {
  AdminUserListItem,
  AdminUserQueryParams,
  AdminUserRoleOption,
  AssignAdminUserRolesParams,
  CreateAdminUserParams,
  PaginationResult,
  ResetAdminUserPasswordParams,
  UpdateAdminUserParams,
} from '@repo/shared/types';

/**
 * 分页查询后台用户
 *
 * @param params 页码、每页数量、关键词、状态和角色筛选条件
 * @returns 用户分页结果
 */
export const fetchAdminUsers = (params: AdminUserQueryParams): Promise<PaginationResult<AdminUserListItem>> => {
  return serviceBase.get<PaginationResult<AdminUserListItem>, AdminUserQueryParams>(API_ADMIN_USERS, params);
};

/**
 * 获取用户筛选和角色分配使用的普通角色选项
 *
 * @returns 全部角色及其状态、系统角色标识
 */
export const fetchAdminUserRoleOptions = (): Promise<AdminUserRoleOption[]> => {
  return serviceBase.get<AdminUserRoleOption[]>(API_ADMIN_USER_ROLE_OPTIONS);
};

/**
 * 新增后台用户
 *
 * @param params 登录名、初始密码、显示名称和状态
 * @returns 新增后的用户记录
 */
export const createAdminUser = (params: CreateAdminUserParams): Promise<AdminUserListItem> => {
  return serviceBase.post<AdminUserListItem, CreateAdminUserParams>(API_ADMIN_USERS, params);
};

/**
 * 编辑用户基础资料
 *
 * @param id 用户主键
 * @param params 显示名称和状态
 * @returns 更新后的用户记录
 */
export const updateAdminUser = (id: number, params: UpdateAdminUserParams): Promise<AdminUserListItem> => {
  return serviceBase.put<AdminUserListItem, UpdateAdminUserParams>(getAdminUserApi(id), params);
};

/**
 * 替换普通用户的角色关联
 *
 * @param id 用户主键
 * @param params 需要保留的角色主键
 */
export const assignAdminUserRoles = (id: number, params: AssignAdminUserRolesParams): Promise<void> => {
  return serviceBase.put<void, AssignAdminUserRolesParams>(getAdminUserRolesApi(id), params);
};

/**
 * 管理员重置指定用户密码
 *
 * @param id 用户主键
 * @param params 新密码
 */
export const resetAdminUserPassword = (id: number, params: ResetAdminUserPasswordParams): Promise<void> => {
  return serviceBase.put<void, ResetAdminUserPasswordParams>(getAdminUserPasswordApi(id), params);
};

/**
 * 删除普通后台用户
 *
 * @param id 用户主键
 */
export const deleteAdminUser = (id: number): Promise<void> => {
  return serviceBase.delete<void>(getAdminUserApi(id));
};
