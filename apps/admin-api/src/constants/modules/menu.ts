/**
 * 页面菜单默认生成的标准 CRUD 权限
 *
 * `key` 会拼接在两段式权限前缀后形成三段式权限码，顺序同时作为新权限节点的默认排列顺序。
 */
export const STANDARD_MENU_PERMISSIONS = [
  { name: '查询', key: 'list' },
  { name: '新增', key: 'create' },
  { name: '编辑', key: 'update' },
  { name: '删除', key: 'delete' },
] as const;
