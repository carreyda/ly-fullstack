/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * NestJS 默认 HTTP 异常响应中允许前端展示的字段
 *
 * 普通业务异常返回字符串，DTO 校验失败时返回多条字符串。其他服务端调试字段不进入用户提示。
 */
export interface NestHttpErrorResponse {
  /**
   * Admin API 返回的业务错误或 DTO 字段校验错误列表
   */
  message?: string | string[];
}

/**
 * 请求服务向应用层请求用户反馈时使用的注入协议
 *
 * 服务层只认识该协议，不直接依赖 Element Plus。管理后台在启动阶段注入具体实现，测试和未来的
 * 其他运行环境可以替换为静默或自定义反馈。
 */
export interface ServiceFeedback {
  /**
   * 展示请求失败提示
   *
   * @param message 已转换为用户可读文本的错误信息
   */
  showError: (message: string) => void;
}

/**
 * 请求服务读取认证状态和通知会话失效时使用的注入协议
 *
 * Token 的持久化、Pinia 状态和登录页跳转都属于应用层职责，Axios 拦截器只通过该协议访问。
 */
export interface ServiceAuth {
  /**
   * 读取当前管理端 Access Token
   *
   * @returns 未登录时返回空字符串
   */
  getToken: () => string;

  /**
   * 通知应用层当前会话已经失效
   */
  onAuthenticationFailure: () => void;
}

/**
 * 单次请求的展示选项
 *
 * 业务接口通常使用服务层统一错误提示；个别需要自行渲染错误状态的页面可以关闭全局提示。
 */
export interface RequestOptions {
  /**
   * 是否由响应拦截器统一展示错误消息，默认展示
   */
  globalErrorMessage?: boolean;

  /**
   * 401 时是否广播全局登录失效事件，路由守卫恢复会话时由守卫自行处理
   */
  unauthorizedEvent?: boolean;
}

/**
 * 管理 API Axios 实例使用的拦截器钩子
 *
 * 请求工厂只负责注册钩子，不包含具体业务规则；token 注入、401 处理和错误提示由各服务实例提供。
 */
export interface InterceptorHooks {
  /**
   * 请求发出前的配置处理函数
   */
  requestInterceptor?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;

  /**
   * 请求配置阶段失败时的错误处理函数
   */
  requestInterceptorCatch?: (error: unknown) => unknown;

  /**
   * 收到成功响应后的处理函数，响应数据仍由请求工厂统一解包
   */
  responseInterceptor?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;

  /**
   * 收到失败响应或网络异常后的处理函数
   */
  responseInterceptorCatch?: (error: unknown) => unknown;
}

/**
 * 扩展后的 Axios 请求配置
 *
 * `any` 来自 Axios 自身泛型默认值，本文件仅继承框架类型，不允许业务代码继续扩散该类型。
 */
export interface ExpandAxiosRequestConfig<D = any> extends AxiosRequestConfig<D> {
  /**
   * 创建请求实例时注册的拦截器钩子
   */
  interceptorHooks?: InterceptorHooks;

  /**
   * 当前请求对全局反馈行为的覆盖配置
   */
  requestOptions?: RequestOptions;
}

/**
 * Axios 拦截器阶段可读取的内部请求配置
 *
 * 该类型用于从失败响应中读取调用方传入的展示选项，不应在业务 API 层直接使用。
 */
export interface ExpandInternalAxiosRequestConfig<D = any> extends InternalAxiosRequestConfig<D> {
  /**
   * 当前请求对全局反馈行为的覆盖配置
   */
  requestOptions?: RequestOptions;
}
