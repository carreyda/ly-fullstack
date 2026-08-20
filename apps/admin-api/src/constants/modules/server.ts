/**
 * API 服务名称
 *
 * 用于健康检查、日志和后续观测系统识别服务来源。
 */
export const SERVER_SERVICE_NAME: string = 'admin-api';

/**
 * API 服务默认监听端口
 *
 * 仅在运行环境未提供 `PORT` 时兜底；本地开发默认使用 3001 端口，
 * 部署环境可以通过进程环境变量覆盖。
 */
export const SERVER_DEFAULT_PORT: number = 3001;

/**
 * 浏览器跨域请求允许使用的 HTTP 方法
 *
 * Fastify CORS 默认方法集合不包含全部写操作，新增 PUT、PATCH 或 DELETE 接口时必须在预检响应中明确放行。
 */
export const SERVER_CORS_METHODS: string[] = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
