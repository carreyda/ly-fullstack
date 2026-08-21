/**
 * 获取完整菜单管理树接口
 */
export const API_GET_ADMIN_MENU_TREE = '/menus/tree';

/**
 * 新增菜单节点接口
 */
export const API_CREATE_ADMIN_MENU = '/menus';

/**
 * 批量保存菜单拖拽顺序接口
 */
export const API_REORDER_ADMIN_MENUS = '/menus/reorder';

/**
 * 获取指定菜单编辑接口地址
 *
 * @param id 菜单主键
 * @returns 菜单编辑接口地址
 */
export const getAdminMenuUpdateApi = (id: number): string => `/menus/${id}`;

/**
 * 获取指定菜单删除接口地址
 *
 * @param id 菜单主键
 * @returns 菜单删除接口地址
 */
export const getAdminMenuDeleteApi = (id: number): string => `/menus/${id}`;

/**
 * 获取标准 CRUD 权限生成接口地址
 *
 * @param id 页面菜单主键
 * @returns 标准权限生成接口地址
 */
export const getAdminMenuStandardPermissionsApi = (id: number): string => `/menus/${id}/standard-permissions`;
