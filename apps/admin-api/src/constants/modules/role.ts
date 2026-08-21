/**
 * 管理后台分页接口允许的每页记录数
 */
export const ADMIN_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/**
 * 系统内置超级管理员角色编码
 *
 * 该角色由种子数据维护并天然拥有全部有效菜单与权限，角色管理不得编辑、分配菜单或删除。
 */
export const SYSTEM_SUPER_ADMIN_ROLE_CODE = 'super_admin';
