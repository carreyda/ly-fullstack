import { AxiosFactory } from './core';
import { getServiceBaseUrl } from './core/helper';
import { serviceBaseInterceptor } from './service-base-interceptor';

import type { ExpandAxiosRequestConfig } from '@/types';

/**
 * 管理 API 的 Axios 请求实例
 *
 * 实例使用 `API_BASE_URL` 作为统一前缀，并在 20 秒后终止无响应请求。当前与后续后台管理接口
 * 共用这套错误处理规则；若未来接入不同后端，应新建独立服务实例和拦截器。
 *
 * 认证说明：本阶段尚未接入登录，请求拦截器不注入 Bearer Token；下一阶段在
 * `service-base-interceptor.ts` 的 `requestInterceptor` 中补齐，不新建第二套服务实例。
 */
const request = new AxiosFactory({
  baseURL: getServiceBaseUrl(),
  timeout: 20_000,
  interceptorHooks: serviceBaseInterceptor,
});

/**
 * 管理 API 基础服务
 *
 * API 模块只传入去掉 `/api` 前缀后的接口路径和业务参数。方法直接返回后端响应体，
 * 当前服务端没有额外的 `data` 响应包裹，调用方不得再次访问 `response.data`。
 */
class ServiceBase {
  /**
   * 发起管理 API GET 请求
   *
   * @param url 相对于 `/api` 的接口路径
   * @param params 序列化到 URL query 的查询参数
   * @param config 当前请求的额外配置
   * @returns 后端直接返回的业务数据
   */
  public get<T = unknown, P = unknown>(url: string, params?: P, config?: ExpandAxiosRequestConfig): Promise<T> {
    return request.get<T>(url, { ...config, params });
  }

  /**
   * 发起管理 API POST 请求
   *
   * @param url 相对于 `/api` 的接口路径
   * @param params 写入 JSON 请求体的业务参数
   * @param config 当前请求的额外配置
   * @returns 后端直接返回的业务数据
   */
  public post<T = unknown, P = unknown>(url: string, params?: P, config?: ExpandAxiosRequestConfig<P>): Promise<T> {
    return request.post<T, P>(url, params, config);
  }

  /**
   * 发起管理 API PUT 请求
   *
   * @param url 相对于 `/api` 的接口路径
   * @param params 写入 JSON 请求体的业务参数
   * @param config 当前请求的额外配置
   * @returns 后端直接返回的业务数据
   */
  public put<T = unknown, P = unknown>(url: string, params?: P, config?: ExpandAxiosRequestConfig<P>): Promise<T> {
    return request.put<T, P>(url, params, config);
  }

  /**
   * 发起管理 API DELETE 请求
   *
   * @param url 相对于 `/api` 的接口路径
   * @param params 序列化到 URL query 的查询参数
   * @param config 当前请求的额外配置
   * @returns 后端直接返回的业务数据
   */
  public delete<T = unknown, P = unknown>(url: string, params?: P, config?: ExpandAxiosRequestConfig): Promise<T> {
    return request.delete<T>(url, { ...config, params });
  }
}

/**
 * 管理 API 的共享服务实例，业务组件应通过 `src/api` 间接调用。
 */
export const serviceBase = new ServiceBase();
