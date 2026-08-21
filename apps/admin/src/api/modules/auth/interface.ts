import { serviceBase } from '@/services/service-base';

import { API_CREATE_AUTH_SESSION, API_GET_AUTH_SESSION } from './api';

import type { AdminLoginParams, AdminLoginResponse, AdminSession } from '@repo/shared/types';

/**
 * 向页面 Hook 和 Store 透出认证接口使用的 Shared HTTP 契约
 */
export type { AdminLoginParams, AdminLoginResponse, AdminSession };

/**
 * 使用管理员账号和密码登录
 *
 * 明文密码只进入本次 HTTPS 请求体，不由 API 层记录或持久化。请求失败时保留 Axios 抛出的异常，
 * 由统一拦截器展示服务端返回的登录错误。
 *
 * @param params 登录名与密码
 * @returns Access Token 和当前权限会话
 */
export const loginAdmin = (params: AdminLoginParams): Promise<AdminLoginResponse> => {
  return serviceBase.post<AdminLoginResponse, AdminLoginParams>(API_CREATE_AUTH_SESSION, params);
};

/**
 * 获取数据库最新的当前管理员会话
 *
 * 路由守卫使用该请求验证持久化 Token。401 由守卫自行清理状态和跳转，因此本请求关闭全局错误提示
 * 与登录失效事件，避免守卫和拦截器同时发起导航。
 *
 * @returns 当前管理员资料、可见菜单树和权限码
 */
export const fetchAdminSession = (): Promise<AdminSession> => {
  return serviceBase.get<AdminSession>(API_GET_AUTH_SESSION, undefined, {
    requestOptions: {
      globalErrorMessage: false,
      unauthorizedEvent: false,
    },
  });
};
