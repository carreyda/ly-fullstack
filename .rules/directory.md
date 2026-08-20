# 目录组织范式

本项目是 `ly-fullstack` 全栈 monorepo，使用 `apps/`、`packages/`、Turborepo 和 pnpm workspace 分包结构。

顶层结构：

```text
ly-fullstack/
├── apps/
│   ├── admin/      # 管理后台，Rsbuild + Vue 3 + Element Plus
│   ├── api/        # C 端 API 服务，NestJS + Fastify
│   └── admin-api/  # 管理 API 服务，NestJS + Fastify
├── packages/
│   ├── charts/     # 无框架 ECharts 能力与公共类型
│   ├── database/   # Prisma Schema、迁移、生成 Client 与数据库类型
│   └── shared/     # 前后端通用类型与无 UI 框架通用工具
├── docs/
└── .rules/
```

本文件的目录规则适用于各子包内部组织；涉及根目录、workspace 编排和子包边界时，以当前 monorepo 结构为准。

## 通用模式：barrel 导出

模块化目录优先采用 `<domain>/index.ts` + `<domain>/modules/<feature>.ts`：

```text
<domain>/
├── index.ts
└── modules/
    ├── feature-a.ts
    └── feature-b.ts
```

适用于：`api/`、`constants/`、`types/`、`utils/`、`stores/`、`router/` 等普通模块目录。

例外：

- Vue 单文件组件目录不强制 barrel，按组件引用便利性决定。
- `hooks/` 不使用 barrel 聚合，业务代码直接从具体 `use-*.ts` 文件导入。
- Nuxt/Nitro 自动扫描的 `pages/`、`middleware/`、`plugins/`、`server/routes/`、`server/middleware/`
  和 `server/plugins/` 不创建 barrel；其中的文件都是框架入口，`index.ts` 会被当作真实入口执行。
- 只有一个文件且短期没有扩展需求的目录，不为了形式拆 `modules/`。
- 构建脚本、测试配置、环境声明保持在仓库根目录或 `build/`、`tests/` 中。
- `services/` 不建立总 `index.ts`；API 模块显式导入具体服务实例，使多后端依赖保持可见。

---

## Shared 共享包边界

LY Fullstack 的跨端共享内容统一维护在 `packages/shared`，不为 HTTP 契约单独创建 package。

- `packages/shared/src/types`：使用 barrel 模式，`types/index.ts` 聚合 `types/modules/*.ts`，统一存放前后端或多个应用共同使用的请求参数、响应结构、分页协议、权限码和通用类型。
- `packages/shared/src/utils`：只收与 Vue、React 等 UI 框架无关的通用工具；可以包含供多个前端复用的浏览器工具，但 `api` 与 `admin-api` 禁止导入该入口。
- 两个 API 只能从 `@repo/shared/types` 使用共享类型，不能从 `@repo/shared` 根入口或 `@repo/shared/utils` 导入，避免浏览器能力进入服务端依赖图。
- `packages/shared` 不维护 `AppEnv`、`ImportMetaEnv`、`ProcessEnv` 等单端环境变量类型；这些类型由 admin、api、admin-api 各自维护。
- `packages/shared/package.json` 同时暴露根入口、`./types` 与 `./utils`；开发阶段类型入口指向源码，不需要预先构建。
- 运行时入口指向 `dist` 中对应产物（CJS）；admin-api 生产构建通过 `tsconfig.build.json` 读取 `dist/types/index.d.ts`。
- 生产环境必须从仓库根目录执行 `pnpm build`，由 Turborepo 先生成 shared 运行时产物，再构建各应用。
- 不要通过单独构建某个应用来替代根构建发布流程，也不要把开发阶段的类型可见性绑定到旧的 `dist/index.d.ts`。

---

## Database 数据库包边界

- `packages/database/prisma`：唯一的 Schema、migration 与种子脚本目录。
- `packages/database/generated/prisma`：Prisma 自动生成源码，不提交仓库、不手动修改。
- `packages/database/src/index.ts`：服务端统一入口，只导出 Prisma Client 与数据库类型。
- database 不依赖 NestJS，不保存任何应用的连接串、JWT、Guard 或业务 Service。
- `apps/api` 与 `apps/admin-api` 可以依赖 database；`apps/admin` 和未来 `apps/web` 禁止依赖。
- 两个 API 不得相互导入源码；需要跨服务共享的安全 HTTP 类型放 shared，需要共享的数据库定义放 database。

---

## Charts 图表包边界

- `packages/charts` 只维护 ECharts 按需注册、实例初始化和与注册能力一致的公共类型。
- 具体图表配置、业务数据转换、颜色语义、Vue 组件和页面交互放在消费应用内。
- 新增图表、组件或渲染能力时，必须同步扩展运行时注册、`ChartOption` 类型和测试。
- 调用方负责在组件卸载时销毁图表实例，禁止让 package 持有组件生命周期。

---

## Admin 标准结构

`apps/admin` 当前是管理后台 SPA，底座可以从最小结构开始，业务迁移时按下面结构逐步补齐：

```text
apps/admin/
├── build/                       # Rsbuild 配置与构建辅助方法
│   ├── rsbuild.base.config.ts
│   ├── rsbuild.dev.config.ts
│   ├── rsbuild.prod.config.ts
├── docs/                        # 专题文档，例如鉴权、部署、接口说明
│   └── auth.md
├── public/                      # 不经构建处理的静态资源
├── tests/                       # Rstest 测试与 setup
├── src/
│   ├── main.ts                  # SPA 入口
│   ├── App.vue                  # 根组件
│   ├── setup.ts                 # 应用启动装配：router/store/plugins 等
│   ├── api/                     # API 层（barrel + modules）
│   │   └── modules/<domain>/
│   │       ├── api.ts           # URL 常量
│   │       └── interface.ts     # 请求函数
│   ├── assets/
│   │   ├── images/              # 源码托管图片
│   │   ├── fonts/               # 字体资源
│   │   ├── styles/              # 全局样式入口与模块
│   │   │   ├── index.scss
│   │   │   ├── mixins.scss
│   │   │   └── modules/
│   │   └── element-plus/        # Element Plus 样式覆盖（引入后使用）
│   ├── bridge/                  # 客户端/容器桥接能力
│   ├── chat/                    # IM SDK 初始化、消息适配、会话能力
│   ├── components/
│   │   ├── base/                # 通用基础组件
│   │   ├── business/            # 跨页面业务组件
│   │   ├── overlay/             # 命令式覆盖层调用能力（barrel + modules）
│   │   └── <feature>/           # 按业务域分组的组件
│   ├── constants/               # 常量（barrel + modules）
│   ├── emitter/                 # 类型化事件总线
│   ├── env/                     # 运行时环境读取与归一化
│   ├── hooks/                   # Composition API hooks，统一 use-*.ts
│   ├── layouts/                 # SPA 布局组件
│   ├── plugins/                 # Vue 插件注册、第三方库装配
│   ├── router/                  # Vue Router（barrel + modules）
│   ├── services/                # HTTP/SDK 服务实例与拦截器
│   ├── stores/                  # Pinia 状态管理（barrel + modules）
│   ├── types/                   # 前端业务类型声明（barrel + modules）
│   ├── utils/                   # 纯工具函数（barrel + modules）
│   └── views/                   # 页面级路由组件
│       └── <feature>/
│           └── index.vue
├── env.d.ts                     # 环境变量与全局类型声明
├── rstest.config.ts             # 测试配置
└── tsconfig.json
```

`apps/web` 是 Nuxt 通用渲染主站，遵循 Nuxt 4 文件路由与 Nitro 服务目录：

```text
apps/web/
├── server/                      # Nitro 服务端扩展
│   ├── middleware/              # Nitro 自动扫描的服务端中间件入口，不使用 barrel
│   ├── plugins/                 # Nitro 自动扫描的生命周期插件入口，不使用 barrel
│   ├── routes/                  # Nitro 自动扫描的服务端路由入口，不使用 barrel
│   └── utils/                   # 仅服务端使用的纯工具，barrel + modules
│       ├── index.ts
│       └── modules/
├── src/
│   ├── assets/styles/           # 全局样式入口与模块
│   ├── components/              # base 与 layouts 通用组件
│   ├── constants/               # web 内共享常量，barrel + modules
│   │   ├── index.ts
│   │   └── modules/
│   ├── hooks/                   # Composition API hooks
│   ├── layouts/                 # Nuxt 布局与桌面端、移动端布局实现
│   ├── middleware/              # Nuxt 路由中间件
│   ├── pages/                   # Nuxt 文件路由薄入口
│   ├── plugins/                 # Nuxt 运行时插件
│   ├── types/                   # web 私有类型，barrel 导出
│   ├── utils/                   # 同构或浏览器端纯工具
│   └── views/                   # 按路由拆分的 desktop/mobile 页面实现
├── nuxt.config.ts
└── tsconfig.json
```

Web 目录边界：

- SSR 服务、静态资源和进程生命周期由 Nuxt/Nitro 承担，不再维护自建 Express/Vite SSR 入口。
- `server/` 只放 Nitro middleware、route、plugin 和仅服务端工具，不导入 Vue 应用代码。
- `server/routes`、`server/middleware`、`server/plugins` 保持一文件一入口，不增加 `index.ts`；
  可复用逻辑下沉到使用 barrel 的 `server/utils`。
- `src/pages/` 只维护文件路由、页面 SEO 和首屏数据入口，不堆叠具体 UI。
- 官网公共布局直接维护在 `src/layouts/desktop.vue`、`src/layouts/mobile.vue`，当前只有一套布局时不增加无意义的中间目录。
- Layout 私有的 Header、Footer 等组件按设备放在 `src/components/layouts/desktop/`、`mobile/`，两端不通过响应式样式共用复杂根组件。
- 页面 UI 保留在 `src/views/<route>/desktop.vue`、`mobile.vue`，文件路由通过静态 `import()` 把两端 loader 传给 `DeviceView`。
- 设备状态使用 Nuxt `useState` 按 SSR 请求隔离并序列化，只在根组件注册一次浏览器媒体查询监听。
- 所有设备相关 HTML 响应必须保留 `Vary: User-Agent`；增加共享缓存前必须同时验证设备缓存键。
- 浏览器源码不得导入 `server/`；Nitro 服务端代码不得导入 `src/components`、`src/pages` 等 Vue 应用模块。
- 首屏数据使用 `useAsyncData` / `useFetch`，服务端读取私有 API 地址，客户端读取 `runtimeConfig.public` 地址，禁止水合后重复请求。

---

## 页面与路由

- `apps/admin` 是 SPA，页面统一放在 `src/views/`。
- `apps/web` 是 Nuxt SSR 主站，文件路由放在 `src/pages/`，页面视觉实现放在 `src/views/`。
- Admin 路由模块统一放在 `src/router/modules/`；Web 路由由 Nuxt 文件系统生成，不维护第二套路由表。
- 页面目录使用 kebab-case；Admin 页面入口统一命名为 `index.vue`，Web 路由文件遵循 Nuxt 文件路由命名。
- 页面私有组件放在页面目录下的 `components/`，不要提升到全局 `components/`。

```text
src/views/chat/
├── index.vue
├── index.scss
└── components/
    └── message-list.vue
```

---

## API 层双文件模式

每个后端模块拆分为两个文件：

### `api.ts` — URL 常量

```ts
/**
 * 用户登录
 */
export const API_LOGIN = '/api/auth/login';

/**
 * 获取用户信息
 */
export const API_GET_USER_INFO = '/api/user/info';
```

### `interface.ts` — 请求函数

```ts
import { serviceCms } from '@/services/service-cms';

import * as API from './api';

import type { LoginParams, LoginResponse } from '@/types';

/**
 * 用户登录
 */
export const login = (params: LoginParams) => {
  return serviceCms.post<LoginResponse, LoginParams>(API.API_LOGIN, params);
};
```

---

## 资源放置

- 需要被构建处理、参与 hash 的资源放在 `src/assets/`。
- 需要保持原始文件名、通过绝对路径访问的资源放在 `public/`。
- 样式入口使用 `src/assets/styles/index.scss`，不要新增多个全局样式入口。
- 字体、图片、Element Plus 覆盖样式按 `assets/` 子目录归类。

---

## 复杂消息组件目录

`message-list-item` 这类复杂消息组件允许使用“共享结构组件 + 类型渲染器”的私有目录结构。

推荐结构：

```text
message-list-item/
├── index.vue
├── index.scss
├── components/
│   ├── message-row/
│   ├── message-avatar/
│   ├── message-quote/
│   └── message-notice/
└── renderers/
    ├── text-message/
    ├── file-message/
    ├── audio-message/
    ├── video-message/
    └── image-message/
```

约束：

- `components/` 放消息项内部共享结构组件，不绑定某一种 SDK 消息类型。
- `renderers/` 放具体消息正文渲染器，负责读取 payload 并输出正文内容。
- `notice` 是顶层居中提示分支，不进入普通消息渲染映射表。
- 普通消息渲染映射表默认保留在 `index.vue` 内部；静态映射不提前拆 `config` 文件。
- 只有映射逻辑依赖 Store、异步预取、复杂业务状态时，才拆 `composables/use-message-render-entry.ts`。
- 不为了目录完整提前创建空目录；新增真实类型或真实结构组件时再创建对应目录。

---

## 覆盖层调用组件

`src/components/overlay/` 用于收敛“调用时创建并挂载到 body”的命令式覆盖层能力，目录采用 barrel + modules：

```text
src/components/overlay/
├── index.ts
└── modules/
    └── image-preview.ts
```

约束：

- `overlay` 表示弹窗、预览、菜单这类覆盖在当前页面之上的 UI 行为，不表示 Vue `app.component()` 全局注册组件。
- `overlay/modules/*.ts` 只放命令式挂载、卸载和单例管理逻辑，不放具体 UI 模板。
- 具体弹窗、菜单、预览组件仍按 UI 归属放在 `components/dialog/*`、`components/context-menu/*` 等目录。
- 业务组件通过 `@/components/overlay` 调用覆盖层能力，不直接从具体 UI 组件目录导入 service。
- 这类能力应在调用时创建根节点并在关闭后卸载，避免 layout 常驻或每个业务组件实例持有隐藏弹窗。
