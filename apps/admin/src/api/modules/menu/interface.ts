import { serviceBase } from '@/services/service-base';

import {
  API_CREATE_ADMIN_MENU,
  API_GET_ADMIN_MENU_TREE,
  API_REORDER_ADMIN_MENUS,
  getAdminMenuDeleteApi,
  getAdminMenuStandardPermissionsApi,
  getAdminMenuUpdateApi,
} from './api';

import type {
  AdminMenuTreeNode,
  CreateAdminMenuParams,
  CreateStandardMenuPermissionsParams,
  CreateStandardMenuPermissionsResult,
  ReorderAdminMenusParams,
  UpdateAdminMenuParams,
} from '@repo/shared/types';

/**
 * 获取包含隐藏、停用和按钮权限的完整菜单管理树
 *
 * @returns 按同级顺序排列的菜单树
 */
export const fetchAdminMenuTree = (): Promise<AdminMenuTreeNode[]> => {
  return serviceBase.get<AdminMenuTreeNode[]>(API_GET_ADMIN_MENU_TREE);
};

/**
 * 新增目录、页面菜单或按钮权限
 *
 * @param params 菜单节点表单数据
 * @returns 服务端归一化后的菜单节点
 */
export const createAdminMenu = (params: CreateAdminMenuParams): Promise<AdminMenuTreeNode> => {
  return serviceBase.post<AdminMenuTreeNode, CreateAdminMenuParams>(API_CREATE_ADMIN_MENU, params);
};

/**
 * 编辑指定菜单节点
 *
 * @param id 菜单主键
 * @param params 完整菜单表单数据
 * @returns 服务端归一化后的菜单节点
 */
export const updateAdminMenu = (id: number, params: UpdateAdminMenuParams): Promise<AdminMenuTreeNode> => {
  return serviceBase.put<AdminMenuTreeNode, UpdateAdminMenuParams>(getAdminMenuUpdateApi(id), params);
};

/**
 * 删除没有子节点的菜单或按钮权限
 *
 * @param id 菜单主键
 */
export const deleteAdminMenu = (id: number): Promise<void> => {
  return serviceBase.delete<void>(getAdminMenuDeleteApi(id));
};

/**
 * 批量保存拖拽后的菜单树位置
 *
 * @param params 全部非按钮节点的最终父级和顺序
 */
export const reorderAdminMenus = (params: ReorderAdminMenusParams): Promise<void> => {
  return serviceBase.put<void, ReorderAdminMenusParams>(API_REORDER_ADMIN_MENUS, params);
};

/**
 * 为页面菜单生成标准查询、新增、编辑和删除权限
 *
 * @param id 页面菜单主键
 * @param params 两段式权限前缀
 * @returns 本次实际新增的权限数量
 */
export const createStandardMenuPermissions = (
  id: number,
  params: CreateStandardMenuPermissionsParams,
): Promise<CreateStandardMenuPermissionsResult> => {
  return serviceBase.post<CreateStandardMenuPermissionsResult, CreateStandardMenuPermissionsParams>(
    getAdminMenuStandardPermissionsApi(id),
    params,
  );
};
