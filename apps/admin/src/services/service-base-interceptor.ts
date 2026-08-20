import { isAxiosError } from 'axios';

import { showErrorMessage } from '@/utils';

import type { ExpandInternalAxiosRequestConfig, InterceptorHooks } from '@/types';

/**
 * NestJS 默认 HTTP 错误响应
 *
 * 参数校验失败时 `message` 可能是多条校验消息；普通异常通常返回单条字符串。
 */
interface NestHttpErrorResponse {
  /**
   * 可直接展示的业务错误，DTO 校验失败时为字符串数组
   */
  message?: string | string[];
}

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
 * 认证说明：本阶段不注入 Bearer Token、不处理 401 登录失效；下一阶段在本拦截器补齐
 * token 注入与登录失效整页跳转，可参考的迁移文件清单见 `docs/extraction-report.md`。
 */
export const serviceBaseInterceptor: InterceptorHooks = {
  requestInterceptor(config) {
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
      showErrorMessage('请求处理失败，请稍后重试');
      return Promise.reject(error);
    }

    const config = error.config as ExpandInternalAxiosRequestConfig | undefined;
    const shouldShowError = config?.requestOptions?.globalErrorMessage !== false;
    const status = error.response?.status;

    if (shouldShowError) {
      const responseMessage = getResponseErrorMessage(error.response?.data);
      const message =
        error.code === 'ERR_NETWORK'
          ? '网络连接失败，请检查 API 服务是否已启动'
          : responseMessage || (status && status >= 500 ? '服务暂时不可用，请稍后重试' : '请求失败，请稍后重试');

      showErrorMessage(message);
    }

    return Promise.reject(error);
  },
};
