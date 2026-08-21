import { serviceBase } from '@/services/service-base';

import { API_ADMIN_ROLES, API_ADMIN_ROLE_MENU_TREE, getAdminRoleApi, getAdminRoleMenusApi } from './api';

import type {
  AdminRoleDetail,
  AdminRoleListItem,
  AdminRoleMenuTreeNode,
  AdminRoleQueryParams,
  AssignAdminRoleMenusParams,
  CreateAdminRoleParams,
  PaginationResult,
  UpdateAdminRoleParams,
} from '@repo/shared/types';

/**
 * 分页查询角色列表
 *
 * @param params 页码、每页数量、关键词和状态筛选条件
 * @returns 角色分页结果
 */
export const fetchAdminRoles = (params: AdminRoleQueryParams): Promise<PaginationResult<AdminRoleListItem>> => {
  return serviceBase.get<PaginationResult<AdminRoleListItem>, AdminRoleQueryParams>(API_ADMIN_ROLES, params);
};

/**
 * 获取指定角色详情
 *
 * @param id 角色主键
 * @returns 角色基础信息和已分配菜单主键
 */
export const fetchAdminRole = (id: number): Promise<AdminRoleDetail> => {
  return serviceBase.get<AdminRoleDetail>(getAdminRoleApi(id));
};

/**
 * 获取角色菜单分配使用的完整权限树
 *
 * @returns 目录、页面和按钮权限树
 */
export const fetchAdminRoleMenuTree = (): Promise<AdminRoleMenuTreeNode[]> => {
  return serviceBase.get<AdminRoleMenuTreeNode[]>(API_ADMIN_ROLE_MENU_TREE);
};

/**
 * 新增普通角色
 *
 * @param params 角色名称、编码、说明和状态
 * @returns 新增后的角色详情
 */
export const createAdminRole = (params: CreateAdminRoleParams): Promise<AdminRoleDetail> => {
  return serviceBase.post<AdminRoleDetail, CreateAdminRoleParams>(API_ADMIN_ROLES, params);
};

/**
 * 编辑普通角色基础信息
 *
 * @param id 角色主键
 * @param params 角色名称、说明和状态
 * @returns 更新后的角色详情
 */
export const updateAdminRole = (id: number, params: UpdateAdminRoleParams): Promise<AdminRoleDetail> => {
  return serviceBase.put<AdminRoleDetail, UpdateAdminRoleParams>(getAdminRoleApi(id), params);
};

/**
 * 替换普通角色的菜单权限
 *
 * @param id 角色主键
 * @param params 权限树选中的菜单主键
 */
export const assignAdminRoleMenus = (id: number, params: AssignAdminRoleMenusParams): Promise<void> => {
  return serviceBase.put<void, AssignAdminRoleMenusParams>(getAdminRoleMenusApi(id), params);
};

/**
 * 删除没有绑定用户的普通角色
 *
 * @param id 角色主键
 */
export const deleteAdminRole = (id: number): Promise<void> => {
  return serviceBase.delete<void>(getAdminRoleApi(id));
};
