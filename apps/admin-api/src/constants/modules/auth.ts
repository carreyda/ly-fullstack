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

/**
 * 图片挑战创建与位置校验在一分钟内允许的最大请求数
 *
 * 图片生成需要消耗 CPU，不能只给最终登录接口限流。该值高于密码登录限额，
 * 为正常的图片刷新和拖动失败留出余量。
 */
export const ADMIN_CAPTCHA_RATE_LIMIT = 20;

/**
 * 图片滑块挑战的有效时间，单位为毫秒
 */
export const ADMIN_CAPTCHA_EXPIRES_IN_MS = 5 * 60_000;

/**
 * 单个 Admin API 进程允许保存的未消费挑战上限
 */
export const ADMIN_CAPTCHA_MAX_RECORDS = 1_000;

/**
 * 验证图片的标准宽度
 */
export const ADMIN_CAPTCHA_IMAGE_WIDTH = 310;

/**
 * 验证图片的标准高度
 */
export const ADMIN_CAPTCHA_IMAGE_HEIGHT = 155;

/**
 * 拼图块的标准宽高
 */
export const ADMIN_CAPTCHA_PUZZLE_SIZE = 56;

/**
 * 用户拖动位置允许的像素误差
 */
export const ADMIN_CAPTCHA_TOLERANCE = 5;

/**
 * 缺口横向坐标的最小值
 */
export const ADMIN_CAPTCHA_OFFSET_MIN = 62;

/**
 * 缺口横向坐标的最大值
 */
export const ADMIN_CAPTCHA_OFFSET_MAX = 230;

/**
 * 缺口纵向坐标的最小值
 */
export const ADMIN_CAPTCHA_TOP_MIN = 42;

/**
 * 缺口纵向坐标的最大值
 */
export const ADMIN_CAPTCHA_TOP_MAX = 94;
