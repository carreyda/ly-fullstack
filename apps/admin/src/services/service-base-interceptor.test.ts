import { beforeEach, describe, expect, it, rstest } from '@rstest/core';
import { AxiosError, AxiosHeaders } from 'axios';

import { getServiceAccessToken, notifyServiceAuthenticationFailure } from '@/services/service-auth';
import { showServiceError } from '@/services/service-feedback';
import { serviceBaseInterceptor } from './service-base-interceptor';

import type { RequestOptions } from '@/types';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

rstest.mock('@/services/service-auth', () => ({
  getServiceAccessToken: rstest.fn(() => ''),
  notifyServiceAuthenticationFailure: rstest.fn(),
}));

rstest.mock('@/services/service-feedback', () => ({
  showServiceError: rstest.fn(),
}));

/**
 * 构造带请求配置与响应的 AxiosError
 *
 * 拦截器从 `error.config.requestOptions` 读取展示配置、从 `error.response` 读取状态码和 NestJS
 * 错误体；本函数按最小结构组装真实 AxiosError 实例，保证 `isAxiosError` 判定与生产一致。
 *
 * @param options 状态码、响应体、错误码、接口地址与展示选项
 * @returns 可直接传给拦截器的 AxiosError
 */
const createHttpError = (options: {
  status: number;
  data?: unknown;
  code?: string;
  url?: string;
  requestOptions?: RequestOptions;
}): AxiosError => {
  const config = {
    headers: new AxiosHeaders(),
    url: options.url,
    requestOptions: options.requestOptions,
  } as InternalAxiosRequestConfig;

  const response = { status: options.status, data: options.data, headers: {}, config } as unknown as AxiosResponse;

  return new AxiosError('Request failed', options.code, config, undefined, response);
};

describe('管理 API 服务拦截器', () => {
  beforeEach(() => {
    rstest.resetAllMocks();
  });

  it('存在 Token 时请求头注入 Bearer Authorization', () => {
    rstest.mocked(getServiceAccessToken).mockReturnValue('jwt-token');

    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    const result = serviceBaseInterceptor.requestInterceptor?.(config);

    expect(result?.headers.Authorization).toBe('Bearer jwt-token');
  });

  it('没有 Token 时不注入 Authorization 请求头', () => {
    rstest.mocked(getServiceAccessToken).mockReturnValue('');

    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    const result = serviceBaseInterceptor.requestInterceptor?.(config);

    expect(result?.headers.Authorization).toBeUndefined();
  });

  it('普通接口返回 401 时广播认证失效事件并展示服务端消息', async () => {
    const error = createHttpError({ status: 401, url: '/users', data: { message: '登录状态已失效' } });

    await expect(serviceBaseInterceptor.responseInterceptorCatch?.(error)).rejects.toBe(error);
    expect(notifyServiceAuthenticationFailure).toHaveBeenCalledTimes(1);
    expect(showServiceError).toHaveBeenCalledWith('登录状态已失效');
  });

  it('登录接口返回 401 时不触发全局认证失效事件', async () => {
    const error = createHttpError({ status: 401, url: '/auth/login', data: { message: '用户名或密码错误' } });

    await expect(serviceBaseInterceptor.responseInterceptorCatch?.(error)).rejects.toBe(error);
    expect(notifyServiceAuthenticationFailure).not.toHaveBeenCalled();
    // 登录失败仍需要向用户展示密码错误原因
    expect(showServiceError).toHaveBeenCalledWith('用户名或密码错误');
  });

  it('unauthorizedEvent 为 false 的 401 请求不触发认证失效事件', async () => {
    const error = createHttpError({
      status: 401,
      url: '/auth/me',
      requestOptions: { unauthorizedEvent: false },
    });

    await expect(serviceBaseInterceptor.responseInterceptorCatch?.(error)).rejects.toBe(error);
    expect(notifyServiceAuthenticationFailure).not.toHaveBeenCalled();
  });

  it('globalErrorMessage 为 false 时只处理认证事件，不展示错误提示', async () => {
    const error = createHttpError({
      status: 401,
      url: '/auth/me',
      requestOptions: { globalErrorMessage: false, unauthorizedEvent: false },
    });

    await expect(serviceBaseInterceptor.responseInterceptorCatch?.(error)).rejects.toBe(error);
    expect(showServiceError).not.toHaveBeenCalled();
  });

  it('网络错误转换为固定的网络连接提示', async () => {
    const error = createHttpError({ status: 0, code: 'ERR_NETWORK', url: '/users' });

    await expect(serviceBaseInterceptor.responseInterceptorCatch?.(error)).rejects.toBe(error);
    expect(showServiceError).toHaveBeenCalledWith('网络连接失败，请检查 API 服务是否已启动');
  });

  it('NestJS DTO 数组消息合并为一条提示，普通字符串消息原样展示', async () => {
    const dtoError = createHttpError({
      status: 400,
      url: '/users',
      data: { message: ['pageNum must not be less than 1', 'pageSize must be an integer number'] },
    });
    await expect(serviceBaseInterceptor.responseInterceptorCatch?.(dtoError)).rejects.toBe(dtoError);
    expect(showServiceError).toHaveBeenCalledWith(
      'pageNum must not be less than 1；pageSize must be an integer number',
    );

    const messageError = createHttpError({ status: 409, url: '/roles', data: { message: '角色编码已存在' } });
    await expect(serviceBaseInterceptor.responseInterceptorCatch?.(messageError)).rejects.toBe(messageError);
    expect(showServiceError).toHaveBeenCalledWith('角色编码已存在');
  });

  it('服务端未返回可展示消息时按状态码给出兜底提示', async () => {
    const serverError = createHttpError({ status: 503, url: '/users', data: 'upstream error' });
    await expect(serviceBaseInterceptor.responseInterceptorCatch?.(serverError)).rejects.toBe(serverError);
    expect(showServiceError).toHaveBeenCalledWith('服务暂时不可用，请稍后重试');

    const clientError = createHttpError({ status: 404, url: '/menus', data: undefined });
    await expect(serviceBaseInterceptor.responseInterceptorCatch?.(clientError)).rejects.toBe(clientError);
    expect(showServiceError).toHaveBeenCalledWith('请求失败，请稍后重试');
  });

  it('非 Axios 错误展示通用处理失败提示并继续抛出', async () => {
    const error = new Error('unexpected');

    await expect(serviceBaseInterceptor.responseInterceptorCatch?.(error)).rejects.toBe(error);
    expect(showServiceError).toHaveBeenCalledWith('请求处理失败，请稍后重试');
    expect(notifyServiceAuthenticationFailure).not.toHaveBeenCalled();
  });
});
