/**
 * 用户分页列表与新增接口
 */
export const API_ADMIN_USERS = '/users';

/**
 * 用户筛选与角色分配选项接口
 */
export const API_ADMIN_USER_ROLE_OPTIONS = '/users/role-options';

/**
 * 获取用户编辑或删除接口地址
 *
 * @param id 用户主键
 * @returns 用户编辑或删除接口地址
 */
export const getAdminUserApi = (id: number): string => `/users/${id}`;

/**
 * 获取用户角色分配接口地址
 *
 * @param id 用户主键
 * @returns 用户角色分配接口地址
 */
export const getAdminUserRolesApi = (id: number): string => `/users/${id}/roles`;

/**
 * 获取管理员重置用户密码接口地址
 *
 * @param id 用户主键
 * @returns 用户密码重置接口地址
 */
export const getAdminUserPasswordApi = (id: number): string => `/users/${id}/password`;
