import type { AdminProfile, PermissionCode, RbacMenuNode } from '@repo/shared/types';

/**
 * 管理端 Access Token 的 JWT 载荷
 *
 * Token 只保存定位账号所需的信息，不写入角色和权限快照。Guard 每次请求都会重新查询数据库，
 * 保证账号禁用、角色解绑和权限收回可以立即生效。
 */
export interface AdminJwtPayload {
  /**
   * RBAC 用户表主键，对应 JWT 标准 subject 字段
   */
  sub: number;

  /**
   * 签发令牌时的管理员登录名，只用于审计和问题排查，不作为授权依据
   */
  username: string;

  /**
   * 签发令牌时的账号会话版本
   *
   * Guard 会将该值与数据库最新版本比较。修改或重置密码会递增数据库版本，令此前签发的
   * Token 在下一次请求时立即失效，无需维护服务端 Token 黑名单。
   */
  tokenVersion: number;
}

/**
 * 已通过 JWT 验签和数据库最新状态校验的管理员访问上下文
 *
 * Guard 将该对象挂载到当前 Fastify 请求，后续 Controller 和权限 Guard 可以复用同一次查询结果。
 */
export interface AuthenticatedAdmin extends AdminProfile {
  /**
   * 数据库当前会话版本，只用于服务端撤销旧 Token，不会进入浏览器会话响应
   */
  tokenVersion: number;

  /**
   * 当前有效角色合并后的可见菜单树
   */
  menus: RbacMenuNode[];

  /**
   * 当前有效角色合并并去重后的操作权限码
   */
  permissions: PermissionCode[];
}

/**
 * 管理 API 使用的 Fastify 请求扩展
 *
 * `admin` 只会在 `AdminJwtGuard` 验证成功后写入，未受保护的公开接口不能假设该字段存在。
 */
export interface AdminRequest {
  /**
   * Fastify 提供的请求头集合
   */
  headers: {
    /**
     * 浏览器发送的 Bearer Token 请求头
     */
    authorization?: string;
  };

  /**
   * 认证守卫写入的当前管理员访问上下文
   */
  admin?: AuthenticatedAdmin;
}

/**
 * Admin API 进程中保存的一次性图片滑块挑战
 *
 * 记录不写入数据库，服务重启后未使用挑战自然失效。当前默认单实例部署使用进程内
 * Map；若扩展为多实例，需要换成 Redis 等共享的带过期时间存储。
 */
export interface AdminCaptchaRecord {
  /**
   * 拼图缺口的正确横向偏移量
   */
  offset: number;

  /**
   * 挑战创建时间戳，用于惰性清理过期记录
   */
  createdAt: number;
}
