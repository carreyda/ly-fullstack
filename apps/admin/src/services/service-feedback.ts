import type { ServiceFeedback } from '@/types';

/**
 * 请求服务当前使用的用户反馈适配器
 *
 * 默认保持静默，避免服务模块在应用装配前加载时隐式依赖 UI 框架。管理后台启动时会通过
 * `setupServiceFeedback` 注入 Element Plus 实现。
 */
let serviceFeedback: ServiceFeedback = {
  showError: () => undefined,
};

/**
 * 配置请求服务的用户反馈实现
 *
 * @param feedback 应用层提供的错误反馈适配器
 */
export const configureServiceFeedback = (feedback: ServiceFeedback): void => {
  serviceFeedback = feedback;
};

/**
 * 请求服务展示错误反馈的唯一出口
 *
 * @param message 已转换为用户可读文本的错误信息
 */
export const showServiceError = (message: string): void => {
  serviceFeedback.showError(message);
};
