import type { ServiceAuth } from '@/types';

/**
 * 请求服务当前使用的认证适配器
 *
 * 默认实现不携带 Token，也不处理 401。管理后台启动后会注入 Pinia 和 Router 对应的实现，
 * 从而避免服务层反向依赖应用状态与页面导航。
 */
let serviceAuth: ServiceAuth = {
  getToken: () => '',
  onAuthenticationFailure: () => undefined,
};

/**
 * 配置请求服务的认证实现
 *
 * @param auth 应用层提供的 Token 读取和会话失效处理能力
 */
export const configureServiceAuth = (auth: ServiceAuth): void => {
  serviceAuth = auth;
};

/**
 * 读取当前请求需要携带的 Access Token
 *
 * @returns 应用层当前保存的 Token；未登录时为空字符串
 */
export const getServiceAccessToken = (): string => serviceAuth.getToken();

/**
 * 通知应用层处理认证失效
 */
export const notifyServiceAuthenticationFailure = (): void => {
  serviceAuth.onAuthenticationFailure();
};
