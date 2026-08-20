import axios from 'axios';

import type { AxiosInstance, AxiosResponse } from 'axios';
import type { ExpandAxiosRequestConfig, InterceptorHooks } from '@/types';

/**
 * Axios 请求工厂
 *
 * 每个后端服务通过独立工厂实例配置自己的服务地址和拦截器。工厂只处理 HTTP 方法调用与响应数据解包，
 * 不感知登录、业务状态码或页面跳转，避免不同服务的认证规则互相污染。
 */
export class AxiosFactory {
  /**
   * 当前服务独享的 Axios 实例
   */
  private readonly instance: AxiosInstance;

  /**
   * 当前服务在创建阶段传入的拦截器钩子
   */
  private readonly interceptorHooks?: InterceptorHooks;

  /**
   * 创建服务请求实例并注册拦截器
   *
   * @param config Axios 基础配置与当前服务的拦截器钩子
   */
  public constructor(config: ExpandAxiosRequestConfig) {
    const { interceptorHooks, ...axiosConfig } = config;

    this.instance = axios.create(axiosConfig);
    this.instance.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';
    this.interceptorHooks = interceptorHooks;
    this.setupInterceptors();
  }

  /**
   * 注册当前服务的请求与响应拦截器
   *
   * 钩子只在实例创建时注册一次，避免组件重复挂载造成拦截器累积和重复提示。
   */
  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      this.interceptorHooks?.requestInterceptor,
      this.interceptorHooks?.requestInterceptorCatch,
    );
    this.instance.interceptors.response.use(
      this.interceptorHooks?.responseInterceptor,
      this.interceptorHooks?.responseInterceptorCatch,
    );
  }

  /**
   * 发起 GET 请求
   *
   * @param url 相对于当前服务 `baseURL` 的接口路径
   * @param config 查询参数及其他 Axios 配置
   * @returns 后端响应体，不包含 Axios 响应元数据
   */
  public async get<T = unknown>(url: string, config?: ExpandAxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  /**
   * 发起 POST 请求
   *
   * @param url 相对于当前服务 `baseURL` 的接口路径
   * @param data 写入请求体的业务参数
   * @param config 当前请求的额外 Axios 配置
   * @returns 后端响应体，不包含 Axios 响应元数据
   */
  public async post<T = unknown, P = unknown>(url: string, data?: P, config?: ExpandAxiosRequestConfig<P>): Promise<T> {
    const response = await this.instance.post<T, AxiosResponse<T>, P>(url, data, config);
    return response.data;
  }

  /**
   * 发起 PUT 请求
   *
   * @param url 相对于当前服务 `baseURL` 的接口路径
   * @param data 写入请求体的业务参数
   * @param config 当前请求的额外 Axios 配置
   * @returns 后端响应体，不包含 Axios 响应元数据
   */
  public async put<T = unknown, P = unknown>(url: string, data?: P, config?: ExpandAxiosRequestConfig<P>): Promise<T> {
    const response = await this.instance.put<T, AxiosResponse<T>, P>(url, data, config);
    return response.data;
  }

  /**
   * 发起 DELETE 请求
   *
   * @param url 相对于当前服务 `baseURL` 的接口路径
   * @param config 查询参数及其他 Axios 配置
   * @returns 后端响应体，不包含 Axios 响应元数据
   */
  public async delete<T = unknown>(url: string, config?: ExpandAxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  /**
   * 使用完整 Axios 配置发起请求
   *
   * @param config 包含 URL、方法、参数和请求选项的完整配置
   * @returns 后端响应体，不包含 Axios 响应元数据
   */
  public async request<T = unknown>(config: ExpandAxiosRequestConfig): Promise<T> {
    const response = await this.instance.request<T>(config);
    return response.data;
  }
}
