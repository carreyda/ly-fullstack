const APP_NAME = '__APP_NAME__';
const BUILD_ID = '__BUILD_ID__';
const CACHE_PREFIX = '__CACHE_PREFIX__';
const PRECACHE = ['__PRECACHE__'];
const DOCUMENT_ALLOWLIST = ['__DOCUMENT_ALLOWLIST__'];

/**
 * 当前构建独占的离线缓存名称
 */
const CACHE_NAME = CACHE_PREFIX + ':' + BUILD_ID;

/**
 * 把导航请求归一化为入口 HTML 的缓存键
 *
 * @param {Request} request 浏览器请求
 * @returns {string} 同源入口文档的绝对缓存键
 */
function toDocumentKey(request) {
  const url = new URL(request.url);
  const scopePath = new URL('./', self.registration.scope).pathname;

  if (request.mode === 'navigate' && url.pathname.indexOf(scopePath) === 0) {
    url.pathname = new URL('./index.html', self.registration.scope).pathname;
    return url.origin + url.pathname;
  }

  if (url.pathname === scopePath || url.pathname + '/' === scopePath) {
    url.pathname = new URL('./index.html', self.registration.scope).pathname;
  }
  return url.origin + url.pathname;
}

/**
 * 判断文档请求是否允许写入入口缓存
 *
 * @param {Request} request 浏览器请求
 * @returns {boolean} 是否属于明确允许缓存的入口文档
 */
function isAllowlistedDocument(request) {
  const documentKey = toDocumentKey(request);
  return DOCUMENT_ALLOWLIST.some(
    (entry) => documentKey === self.location.origin + new URL(entry, self.registration.scope).pathname,
  );
}

/**
 * 判断请求是否为页面文档
 *
 * @param {Request} request 浏览器请求
 * @returns {boolean} 是否按入口文档策略处理
 */
function isDocumentRequest(request) {
  if (request.mode === 'navigate') {
    return true;
  }
  return new URL(request.url).pathname.endsWith('.html');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const requests = PRECACHE.map(
        (path) => new Request(new URL(path, self.registration.scope).toString(), { cache: 'reload' }),
      );
      return cache.addAll(requests);
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.indexOf(CACHE_PREFIX + ':') === 0 && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * 使用缓存优先策略响应入口文档，网络失败时回退离线页面
 *
 * @param {FetchEvent} event Service Worker 请求事件
 * @returns {Promise<Response>} 可用于页面导航的响应
 */
function handleDocument(event) {
  const cacheKey = toDocumentKey(event.request);
  return caches.open(CACHE_NAME).then((cache) =>
    cache.match(cacheKey).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          const contentType = response.headers.get('content-type') || '';
          if (
            response.status === 200 &&
            contentType.indexOf('text/html') !== -1 &&
            isAllowlistedDocument(event.request)
          ) {
            cache.put(cacheKey, response.clone());
          }
          return response;
        })
        .catch(() => cached || caches.match(new URL('./offline.html', self.registration.scope).toString()));

      return cached || network;
    }),
  );
}

/**
 * 使用缓存优先策略响应带内容哈希的静态资产
 *
 * @param {FetchEvent} event Service Worker 请求事件
 * @returns {Promise<Response>} 缓存或网络返回的静态资源
 */
function handleAsset(event) {
  return caches.open(CACHE_NAME).then((cache) =>
    cache.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        if (response.status === 200) {
          cache.put(event.request, response.clone());
        }
        return response;
      });
    }),
  );
}

/**
 * 判断请求是否属于允许离线缓存的静态资产
 *
 * @param {Request} request 浏览器请求
 * @returns {boolean} 是否按静态资产策略处理
 */
function isAssetRequest(request) {
  const pathname = new URL(request.url).pathname;
  return /\.(?:js|css|png|jpe?g|gif|svg|webp|woff2?|ttf|eot|ico)$/.test(pathname);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  if (isDocumentRequest(request)) {
    event.respondWith(handleDocument(event));
    return;
  }

  if (isAssetRequest(request)) {
    event.respondWith(handleAsset(event));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
    return;
  }

  if (event.data && event.data.type === 'CLEAR_OFFLINE_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames
              .filter((cacheName) => cacheName.indexOf(CACHE_PREFIX + ':') === 0)
              .map((cacheName) => caches.delete(cacheName)),
          ),
        ),
    );
  }
});

self.__OFFLINE_APP_NAME__ = APP_NAME;
