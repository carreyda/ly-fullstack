import { isAxiosError } from 'axios';

import { getServiceAccessToken, notifyServiceAuthenticationFailure } from '@/services/service-auth';
import { showServiceError } from '@/services/service-feedback';

import type { ExpandInternalAxiosRequestConfig, InterceptorHooks, NestHttpErrorResponse } from '@/types';

/**
 * 从 NestJS 错误响应中提取中文提示
 *
 * @param data Axios 返回的未知响应体
 * @returns 可展示的错误文本；响应结构不符合约定时返回空字符串
 */
const getResponseErrorMessage = (data: unknown): string => {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const response = data as NestHttpErrorResponse;
  if (Array.isArray(response.message)) {
    return response.message.join('；');
  }

  return typeof response.message === 'string' ? response.message : '';
};

/**
 * 管理 API 服务拦截器
 *
 * 响应失败时统一处理网络异常和服务端消息。成功响应保持 Axios 原结构，最终由 `AxiosFactory`
 * 解包一次，匹配当前后端直接返回业务数据的约定。
 *
 * 请求阶段统一注入 Bearer Token；非登录接口返回 401 时广播会话失效事件，路由跳转由应用入口处理，
 * 避免请求层直接依赖 Router 或 Pinia。
 */
export const serviceBaseInterceptor: InterceptorHooks = {
  requestInterceptor(config) {
    const token = getServiceAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  requestInterceptorCatch(error) {
    return Promise.reject(error);
  },

  responseInterceptor(response) {
    return response;
  },

  responseInterceptorCatch(error) {
    if (!isAxiosError(error)) {
      showServiceError('请求处理失败，请稍后重试');
      return Promise.reject(error);
    }

    const config = error.config as ExpandInternalAxiosRequestConfig | undefined;
    const shouldShowError = config?.requestOptions?.globalErrorMessage !== false;
    const status = error.response?.status;

    if (status === 401 && config?.url !== '/auth/login' && config?.requestOptions?.unauthorizedEvent !== false) {
      notifyServiceAuthenticationFailure();
    }

    if (shouldShowError) {
      const responseMessage = getResponseErrorMessage(error.response?.data);
      const message =
        error.code === 'ERR_NETWORK'
          ? '网络连接失败，请检查 API 服务是否已启动'
          : responseMessage || (status && status >= 500 ? '服务暂时不可用，请稍后重试' : '请求失败，请稍后重试');

      showServiceError(message);
    }

    return Promise.reject(error);
  },
};
