import type { PermissionCode, RbacMenuNode, RbacRoleSummary } from './rbac';

/**
 * 管理端账号密码凭据。
 */
export interface AdminLoginCredentials {
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
 * 管理端账号密码登录参数。
 *
 * 登录接口同时消费一份已经由服务端校验通过的图片滑块凭证。挑战编号只能使用
 * 一次，登录成功或失败后都不能重放。
 */
export interface AdminLoginParams extends AdminLoginCredentials {
  /**
   * Admin API 签发的一次性图片滑块挑战编号
   */
  captchaId: string;
}

/**
 * 管理端图片滑块校验参数。
 */
export interface AdminCaptchaVerifyParams {
  /**
   * Admin API 签发的一次性图片滑块挑战编号
   */
  captchaId: string;

  /**
   * 用户完成拼图时的横向偏移量，单位为像素
   */
  offset: number;
}

/**
 * 管理端登录图片滑块挑战。
 *
 * 背景图已在服务端绘制缺口，拼图块也由服务端从原图裁出。响应不包含正确横坐标，
 * 浏览器只负责展示和上报用户实际拖动位置。
 */
export interface AdminCaptchaResponse {
  /**
   * 一次性挑战编号
   */
  captchaId: string;

  /**
   * 已绘制缺口的 SVG Data URL
   */
  backgroundImage: string;

  /**
   * 带透明轮廓的拼图块 SVG Data URL
   */
  puzzleImage: string;

  /**
   * 验证图片宽度，单位为像素
   */
  imageWidth: number;

  /**
   * 验证图片高度，单位为像素
   */
  imageHeight: number;

  /**
   * 拼图块宽高，单位为像素
   */
  puzzleSize: number;

  /**
   * 拼图块在背景图中的纵向位置，单位为像素
   */
  puzzleTop: number;
}

/**
 * 当前管理员主动修改登录密码的请求参数
 *
 * 与用户管理中的“重置他人密码”不同，本操作必须提供当前密码，由认证服务再次验证账号归属。
 */
export interface ChangeAdminPasswordParams {
  /**
   * 当前正在使用的登录密码，只参与本次 bcrypt 校验
   */
  currentPassword: string;

  /**
   * 需要替换的新登录密码，服务端只保存 bcrypt 哈希
   */
  newPassword: string;
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
