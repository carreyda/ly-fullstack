/**
 * 构建期注入的 Service Worker 文件地址
 */
declare const __OFFLINE_SW_URL__: string;

/**
 * 构建期注入的 Service Worker 注册作用域
 */
declare const __OFFLINE_SW_SCOPE__: string;

/**
 * 构建期注入的新 Worker 通知开关
 */
declare const __OFFLINE_NOTIFY_UPDATE__: boolean;

/**
 * 当前部署环境的 Service Worker 地址
 */
const serviceWorkerUrl: string = typeof __OFFLINE_SW_URL__ === 'string' ? __OFFLINE_SW_URL__ : './sw.js';

/**
 * 当前部署环境的 Service Worker 作用域
 */
const serviceWorkerScope: string =
  typeof __OFFLINE_SW_SCOPE__ === 'string' ? __OFFLINE_SW_SCOPE__ : './';

/**
 * 新 Worker 安装完成后是否提示用户更新
 */
const notifyUpdateReady: boolean =
  typeof __OFFLINE_NOTIFY_UPDATE__ === 'boolean' ? __OFFLINE_NOTIFY_UPDATE__ : true;

/**
 * 通知业务 bootstrap 当前 Service Worker 已准备好更新
 */
const dispatchUpdateReady = (): void => {
  if (!notifyUpdateReady) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('app-update-ready', {
      detail: {
        source: 'service-worker',
      },
    }),
  );
};

/**
 * Service Worker 只允许在安全上下文使用，`file:` 预览和不支持该能力的浏览器直接降级为普通网页。
 */
const canUseServiceWorker: boolean =
  'serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:';

if (canUseServiceWorker) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(serviceWorkerUrl, { scope: serviceWorkerScope })
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          dispatchUpdateReady();
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              dispatchUpdateReady();
            }
          });
        });
      })
      .catch(() => {
        /**
         * 离线缓存属于增强能力，注册失败不能阻断管理后台启动和正常联网使用。
         */
      });
  });
}

export {};
