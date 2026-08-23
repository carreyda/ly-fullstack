# Admin 版本检测与离线缓存

本文记录 `apps/admin` 的静态版本识别、离线缓存和更新刷新机制。目标是让换电脑、换部署环境或换维护者后，仍能准确理解构建产物之间的关系，不再从旧项目复制带品牌前缀的实现。

## 能力边界

这套机制解决三个问题：

1. 静态资源已经发布新版本，但用户仍停留在旧页面时，能够主动提示更新。
2. 网络短暂不可用时，已经访问过的管理后台仍能加载入口和静态资源，并显示明确的离线兜底页。
3. 用户确认更新后，清除可能与新版数据结构不兼容的浏览器状态，再重新加载最新构建。

它不负责缓存业务 API，不提供真正的离线业务操作，也不替代服务器缓存策略、灰度发布或回滚能力。

## 目录职责

```text
apps/admin/
├── build/runtime/
│   ├── version.ts              # 生成 version.json 并向 HTML 注入版本 meta
│   ├── check.ts                # 浏览器轮询版本清单
│   ├── offline.ts              # 生成离线页、预缓存清单和 Service Worker
│   └── offline/
│       ├── register.ts         # 浏览器注册 Worker 并派发更新事件
│       └── sw-template.js      # Service Worker 产物模板
└── src/bootstrap/index.ts      # 应用装配、更新确认、客户端状态清理与刷新
```

`build/runtime` 属于构建基础设施，不依赖 Vue 页面和业务 Store。`src/bootstrap` 属于应用启动层，负责把构建运行时派发的事件转化为用户可见交互。

## 构建号如何生成

`version.ts` 在 Rsbuild 的 build 收尾阶段读取最终资产：

- 资产名称与内容共同进入 SHA-256 摘要。
- `version.json`、`.gz` 副本和 HTML 中已经存在的版本 meta 不参与摘要。
- 摘要截取八位，并与应用名、`apps/admin/package.json` 版本号组合为 buildId。

最终构建会生成类似内容：

```json
{
  "appName": "ly-fullstack-admin",
  "packageVersion": "0.1.0",
  "buildId": "ly-fullstack-admin@0.1.0:1234abcd",
  "buildTime": "2026-08-23T00:00:00.000Z",
  "env": "production"
}
```

同一份 buildId 同时写入 HTML：

```html
<meta name="app-name" content="ly-fullstack-admin" />
<meta name="build-id" content="ly-fullstack-admin@0.1.0:1234abcd" />
<meta name="build-time" content="2026-08-23T00:00:00.000Z" />
```

`build-id` 是固定的通用名称。禁止恢复 `hrhg-build-id`、`champion-build-id` 或其他项目标识，否则模板使用者需要为同一种能力维护多套查询逻辑。

## 浏览器如何发现新版本

test 和 production 构建会把 `build/runtime/check.ts` 作为 Rsbuild `preEntry` 注入。它读取当前 HTML 的 `build-id`，再通过以下时机请求不使用缓存的 `version.json`：

- 页面完成加载；
- 浏览器恢复联网；
- 页面重新获得焦点；
- 标签页重新变为可见；
- 页面保持打开时每五分钟轮询。

最新 buildId 与当前页面不一致时，运行时派发 `app-update-ready`。请求失败会静默跳过，不阻断页面渲染或用户操作。

开发环境没有最终构建产物，因此既不轮询 `version.json`，也不注册 Service Worker。

## 离线缓存策略

test 和 production 构建会额外生成：

- `sw.js`：当前构建的 Service Worker；
- `offline.html`：入口和网络都不可用时的兜底页面。

预缓存范围包括：

- `index.html`；
- 构建生成的 JS 和 CSS；
- 图片、字体、SVG、favicon 等静态资产；
- `offline.html`。

明确不缓存：

- 业务 API；
- POST、PUT、PATCH、DELETE 等非 GET 请求；
- 跨域资源；
- gzip 副本和 Service Worker 自身。

带内容哈希的静态资产使用缓存优先。入口文档存在缓存时可以离线打开，同时会在联网时尝试更新缓存。新 Worker 安装完成但页面仍由旧 Worker 控制时，`register.ts` 同样派发 `app-update-ready`。

## 更新确认与清理边界

`src/bootstrap/index.ts` 同时承接原 `setup.ts` 的 Pinia、Router、请求反馈和认证失效装配，并监听 `app-update-ready`。

用户点击“立即更新”后依次处理：

1. 清空 localStorage。
2. 清空 sessionStorage。
3. 尝试清空当前域名的 CacheStorage。
4. 尝试注销当前域名的历史 Service Worker。
5. 刷新当前页面，加载最新入口和静态资源。

CacheStorage 或 Service Worker 清理失败不会阻止刷新。

Cookie 不在清理范围内。登录页“记住账号”使用 `js-cookie` 保存，版本升级不能因为清理 Pinia 持久化状态而抹掉用户主动保留的账号。密码交给浏览器密码管理器，禁止写入应用 Cookie；也禁止用遍历 Cookie、覆盖过期时间或清空站点数据的方式实现版本更新。

## 部署要求

- 服务器必须发布 `index.html`、`version.json`、`sw.js` 和其余静态资产，不能只同步带 hash 的 JS/CSS。
- `version.json` 应使用不缓存或短缓存响应；浏览器运行时也会通过 `cache: 'no-store'` 请求。
- `sw.js` 不应使用长期 immutable 缓存，否则浏览器无法及时发现新 Worker。
- HTTPS 部署可以正常注册 Service Worker；本地开发通常由 localhost 安全上下文豁免，但本项目开发模式主动禁用 Worker。
- 如果未来改为子路径部署，必须同时调整 Rsbuild `assetPrefix`、版本清单地址和 Service Worker scope，三者不能分别配置。

## 验证方式

执行生产构建：

```bash
pnpm --filter @repo/admin build:prod
```

至少检查：

1. `dist/version.json` 存在，buildId 非空。
2. `dist/index.html` 存在 `meta[name="build-id"]`，且与清单一致。
3. `dist/sw.js`、`dist/offline.html` 存在。
4. `dist/sw.js` 的预缓存路径与当前构建资产一致。
5. 重新构建并替换部署产物后，旧页面能出现一次更新提示。
6. 点击确认后 Web Storage 和缓存被清理、页面刷新，但记住账号的 Cookie 仍存在。
