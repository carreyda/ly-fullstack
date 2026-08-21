import type { PermissionCode, RbacMenuNode, RbacRoleSummary } from './rbac';

/**
 * 管理端账号密码登录参数。
 */
export interface AdminLoginParams {
  /**
   * 管理员登录名，对应 RBAC 用户表中的唯一账号
   */
  username: string;

  /**
   * 管理员明文密码，只允许通过 HTTPS 请求体发送，不得写入日志或浏览器持久化状态
   */
  password: string;
}

/**
 * 已登录管理员的非敏感资料。
 */
export interface AdminProfile {
  /**
   * RBAC 用户表主键
   */
  id: number;

  /**
   * 当前管理员的唯一登录名
   */
  username: string;

  /**
   * 顶栏和个人信息区域使用的展示名称，未设置时由前端回退到登录名
   */
  displayName: string | null;

  /**
   * 当前账号已经绑定且处于启用状态的角色列表
   */
  roles: RbacRoleSummary[];
}

/**
 * 管理端当前会话需要的用户、菜单与权限快照。
 */
export interface AdminSession {
  /**
   * 已通过 JWT 和数据库状态校验的管理员资料
   */
  user: AdminProfile;

  /**
   * 根据有效角色合并后的可见菜单树，不包含按钮权限节点
   */
  menus: RbacMenuNode[];

  /**
   * 根据有效角色合并并去重后的按钮与接口权限码
   */
  permissions: PermissionCode[];
}

/**
 * 管理端登录成功响应。
 */
export interface AdminLoginResponse extends AdminSession {
  /**
   * 后续管理 API 请求放入 Authorization 请求头的 Bearer Access Token
   */
  token: string;
}
