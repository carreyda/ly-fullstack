/**
 * 构建期注入的版本清单访问地址
 */
declare const __APP_VERSION_URL__: string;

/**
 * 构建期注入的 Service Worker 注册作用域
 */
declare const __APP_VERSION_SW_SCOPE__: string;

/**
 * 版本清单默认每五分钟轮询一次
 */
const CHECK_INTERVAL = 5 * 60 * 1000;

/**
 * 当前部署环境的版本清单地址
 */
const versionUrl: string = typeof __APP_VERSION_URL__ === 'string' ? __APP_VERSION_URL__ : './version.json';

/**
 * 当前部署环境的 Service Worker 作用域
 */
const serviceWorkerScope: string =
  typeof __APP_VERSION_SW_SCOPE__ === 'string' ? __APP_VERSION_SW_SCOPE__ : './';

/**
 * 当前页面 HTML 已加载的构建号
 *
 * 名称固定使用通用的 `build-id`，不得重新加入项目或公司前缀。
 */
const currentBuildId: string = document.querySelector<HTMLMetaElement>('meta[name="build-id"]')?.content.trim() ?? '';

/**
 * 防止多个浏览器事件并发请求版本清单
 */
let checking = false;

/**
 * 防止同一页面生命周期重复派发更新事件
 */
let notified = false;

/**
 * 通知当前作用域的 Service Worker 主动检查更新
 *
 * 版本清单已经发现新构建时同步触发 Worker 更新，可以让新 Worker 尽早进入 waiting 状态。
 * 浏览器不支持该能力或当前页面尚未注册 Worker 时静默跳过。
 */
const updateServiceWorker = (): void => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  void navigator.serviceWorker.getRegistration(serviceWorkerScope).then((registration) => registration?.update());
};

/**
 * 派发应用更新就绪事件
 *
 * @param latest 服务器返回的最新版本清单
 */
const dispatchUpdateReady = (latest: AppVersionManifest): void => {
  if (notified) {
    return;
  }

  notified = true;
  updateServiceWorker();
  window.dispatchEvent(
    new CustomEvent('app-update-ready', {
      detail: {
        source: 'version',
        currentBuildId,
        latestBuildId: latest.buildId,
        latest,
      },
    }),
  );
};

/**
 * 检测管理后台是否存在新版本
 *
 * 浏览器读取不缓存的 `version.json`，当最新 buildId 与当前页面 `build-id` 不一致时派发
 * `app-update-ready`。网络失败、文件暂不可用或格式不完整时必须静默处理，不能影响主应用渲染。
 */
const checkAppVersion = async (): Promise<void> => {
  if (!currentBuildId || checking || notified || document.visibilityState === 'hidden') {
    return;
  }

  checking = true;
  try {
    const response = await fetch(versionUrl, { cache: 'no-store' });
    if (!response.ok) {
      return;
    }

    const latest = (await response.json()) as Partial<AppVersionManifest>;
    if (latest.buildId && latest.buildId !== currentBuildId) {
      dispatchUpdateReady(latest as AppVersionManifest);
    }
  } catch {
    /**
     * 版本检查属于增强能力，离线或服务端短暂不可用时不能阻断页面运行。
     */
  } finally {
    checking = false;
  }
};

if (currentBuildId) {
  window.addEventListener('load', () => {
    window.setTimeout(checkAppVersion, 0);
  });
  window.addEventListener('online', checkAppVersion);
  window.addEventListener('focus', checkAppVersion);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void checkAppVersion();
    }
  });
  window.setInterval(checkAppVersion, CHECK_INTERVAL);
}

export {};
