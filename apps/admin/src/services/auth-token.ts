/**
 * 请求层当前使用的 Access Token。
 *
 * 持久化与业务状态仍由 Pinia 管理；这个轻量桥接只避免 Axios 拦截器反向依赖 Store，
 * 从而消除 `Store -> API -> Axios -> Store` 的循环引用。
 */
let accessToken = '';

/**
 * 更新请求层使用的 Access Token
 *
 * @param token Auth Store 当前持有的 Token；空字符串表示后续请求不再携带认证头
 */
export const setRequestAccessToken = (token: string): void => {
  accessToken = token;
};

/**
 * 读取请求层当前使用的 Access Token
 *
 * @returns Axios 请求拦截器需要写入 Authorization 头的 Token；未登录时返回空字符串
 */
export const getRequestAccessToken = (): string => accessToken;
