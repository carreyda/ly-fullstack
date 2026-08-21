/**
 * 角色分页列表与新增接口
 */
export const API_ADMIN_ROLES = '/roles';

/**
 * 角色菜单分配树接口
 */
export const API_ADMIN_ROLE_MENU_TREE = '/roles/menu-tree';

/**
 * 获取角色详情或编辑接口地址
 *
 * @param id 角色主键
 * @returns 角色详情与编辑接口地址
 */
export const getAdminRoleApi = (id: number): string => `/roles/${id}`;

/**
 * 获取角色菜单分配接口地址
 *
 * @param id 角色主键
 * @returns 角色菜单分配接口地址
 */
export const getAdminRoleMenusApi = (id: number): string => `/roles/${id}/menus`;
