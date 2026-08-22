import { setupServiceFeedback } from '@/feedback';
import router from '@/router';
import { configureServiceAuth } from '@/services/service-auth';
import pinia, { useAuthStore } from '@/stores';

import type { App } from 'vue';

/**
 * 防止版本清单和 Service Worker 同时触发多个更新确认框
 */
let updatePromptVisible = false;

/**
 * 清理当前管理后台的浏览器键值存储
 *
 * 更新页面前清空 localStorage 和 sessionStorage，避免新版代码继续读取结构已经变化的 Pinia 持久化状态、
 * 版本缓存或页面临时数据。该方法不会清理 Cookie，因此用户主动勾选的登录账号密码能够跨版本保留。
 */
const clearBrowserStorage = (): void => {
  window.localStorage.clear();
  window.sessionStorage.clear();
};

/**
 * 清理当前域名下的 CacheStorage
 *
 * Service Worker 预缓存可能仍保存旧入口和静态资源。浏览器不支持 Cache API 时静默跳过；
 * 删除失败会由 `clearClientState` 隔离，不能阻止页面刷新。
 */
const clearCacheStorage = async (): Promise<void> => {
  if (!('caches' in window)) {
    return;
  }

  const cacheNames = await window.caches.keys();
  await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
};

/**
 * 注销当前域名下已经注册的 Service Worker
 *
 * 刷新后新的构建入口会重新注册当前版本 Worker。先注销旧 Worker 可以避免刷新请求继续被旧缓存代理。
 * 浏览器不支持 Service Worker 时静默跳过。
 */
const unregisterServiceWorkers = async (): Promise<void> => {
  if (!('serviceWorker' in window.navigator)) {
    return;
  }

  const registrations = await window.navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
};

/**
 * 清理可能影响新版本加载的客户端状态
 *
 * Web Storage 同步清理，CacheStorage 与 Service Worker 并行处理。异步能力使用 `allSettled` 隔离失败，
 * 单项清理失败不能阻止用户刷新并尝试加载最新构建。Cookie 明确不在清理范围内。
 */
const clearClientState = async (): Promise<void> => {
  clearBrowserStorage();
  await Promise.allSettled([clearCacheStorage(), unregisterServiceWorkers()]);
};

/**
 * 提示用户确认加载最新版本
 *
 * 确认后清理 Web Storage、CacheStorage 和历史 Service Worker，再刷新当前页面。取消或关闭提示时释放弹窗锁；
 * 锁定期间忽略重复事件，防止版本轮询与 Worker 更新同时打开多个确认框或并发清理。
 */
const confirmAppUpdate = async (): Promise<void> => {
  if (updatePromptVisible) {
    return;
  }

  updatePromptVisible = true;
  try {
    await ElMessageBox.confirm('检测到新版本，是否立即更新？', '版本更新', {
      type: 'warning',
      confirmButtonText: '立即更新',
      cancelButtonText: '稍后处理',
      closeOnClickModal: false,
      closeOnPressEscape: false,
    });
    await clearClientState();
    window.location.reload();
  } catch {
    updatePromptVisible = false;
  }
};

/**
 * 接收构建运行时派发的版本更新事件并启动异步确认流程
 */
const handleAppUpdateReady = (): void => {
  void confirmAppUpdate();
};

/**
 * 装配管理后台插件与认证边界
 *
 * 启动阶段集中注册 Pinia、Router、请求反馈适配器和认证失效监听。业务组件不负责全局插件注册，
 * 请求服务也不直接依赖路由、Store 或 Element Plus。
 *
 * @param app Vue 管理后台应用实例
 */
const setupAdminApp = (app: App): void => {
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

/**
 * 启动管理后台全部运行时能力
 *
 * 该入口统一承接原 `setup.ts` 的应用装配能力，并注册 `app-update-ready` 全局事件。检测到新构建后会提示用户，
 * 用户确认时清理可能不兼容的客户端状态并刷新页面；Cookie 不会被清理，记住账号密码能力不受发版影响。
 *
 * @param app Vue 管理后台应用实例
 * @returns 取消全局事件监听的函数，供测试、微前端卸载或未来应用销毁时调用
 */
export const bootstrapAdminApp = (app: App): (() => void) => {
  setupAdminApp(app);
  window.addEventListener('app-update-ready', handleAppUpdateReady);

  return () => {
    window.removeEventListener('app-update-ready', handleAppUpdateReady);
  };
};
