import { configureServiceFeedback } from '@/services/service-feedback';
import { showErrorMessage } from './message';

/**
 * 将管理后台的 Element Plus 消息实现注入请求服务
 *
 * 该装配只在应用启动时执行一次，使请求拦截器无需导入 UI 组件或了解页面结构。
 */
export const setupServiceFeedback = (): void => {
  configureServiceFeedback({
    showError: showErrorMessage,
  });
};
