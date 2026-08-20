/**
 * C 端 API 服务名称
 *
 * 用于健康检查、日志和后续观测系统识别服务来源。
 */
export const SERVER_SERVICE_NAME: string = 'api';

/**
 * C 端 API 默认监听端口
 *
 * 仅在运行环境未提供 `PORT` 时兜底；部署环境可以通过进程环境变量覆盖。
 */
export const SERVER_DEFAULT_PORT: number = 3000;

/**
 * 浏览器跨域请求允许使用的 HTTP 方法
 */
export const SERVER_CORS_METHODS: string[] = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
