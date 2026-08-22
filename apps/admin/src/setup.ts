import { setupServiceFeedback } from './feedback';
import router from './router';
import { configureServiceAuth } from './services/service-auth';
import pinia, { useAuthStore } from './stores';

import type { App } from 'vue';

/**
 * 装配管理后台运行时能力
 *
 * 启动阶段集中注册 Pinia、Router、请求反馈适配器和认证失效监听。业务组件不负责全局插件注册，
 * 请求服务也不直接依赖路由、Store 或 Element Plus。
 *
 * @param app Vue 管理后台应用实例
 */
export const setupAdminApp = (app: App): void => {
  setupServiceFeedback();
  app.use(pinia);

  const authStore = useAuthStore(pinia);
  configureServiceAuth({
    getToken: () => authStore.token,
    onAuthenticationFailure: () => {
      const currentRoute = router.currentRoute.value;
      authStore.logout();

      if (currentRoute.name !== 'Login') {
        void router.replace({
          name: 'Login',
          query: { redirect: currentRoute.fullPath },
        });
      }
    },
  });

  app.use(router);
};
