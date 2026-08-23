/**
 * 管理端登录接口在限流窗口内允许的最大请求次数
 *
 * 当前限流存储位于单个 Node.js 进程内，适用于本项目默认的单实例部署。多实例部署需要在网关层
 * 统一限流或替换为共享存储，不能把多个进程各自的计数器视为全局防护。
 */
export const ADMIN_LOGIN_RATE_LIMIT = 5;

/**
 * 管理端登录接口的限流统计窗口，单位为毫秒
 */
export const ADMIN_LOGIN_RATE_TTL_MS = 60_000;

/**
 * 触发登录限流后的阻断时长，单位为毫秒
 */
export const ADMIN_LOGIN_RATE_BLOCK_MS = 60_000;

/**
 * 管理端登录限流器名称
 *
 * 显式命名可以避免未来增加其他接口限流策略时误用同一组配置。
 */
export const ADMIN_LOGIN_THROTTLER_NAME = 'admin-login';
