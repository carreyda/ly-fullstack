---
title: 目录与职责
description: 逐层解释 apps、packages、scripts、website、docs、rules 与 workspace 配置的职责，帮助开发者把新代码放进正确边界。
---

# 目录与职责

LY Fullstack 使用 pnpm workspace + Turborepo 管理运行应用和共享包。目录划分不是展示用结构，而是依赖方向和维护职责的一部分。

```text
ly-fullstack/
├── apps/
│   ├── admin/                 # Vue 管理后台
│   ├── admin-api/             # 管理端 NestJS API
│   └── api/                   # 默认 C 端 NestJS API
├── packages/
│   ├── database/              # Prisma Schema、migration 与 Client
│   ├── shared/                # 跨端类型与无 UI 框架工具
│   └── charts/                # ECharts 注册、初始化和公共类型
├── scripts/
│   ├── templates/server/      # 新服务模板
│   └── *.mjs                  # Setup、开发启动、架构检查
├── docs/                      # 工程专题文档与实现真相源
├── website/                   # Rspress 官方使用文档站源码
├── .rules/                    # 各技术栈的强制开发规范
├── tests/e2e/                 # Playwright 关键流程冒烟测试
├── workspace.config.json      # 应用注册表
└── AGENTS.md                  # AI 协作入口与规则路由
```

## `apps/admin`

浏览器应用，负责页面渲染、交互、路由、前端状态和管理 API 调用。

重要边界：

- `views/` 维护路由页面和页面私有组件。
- `components/` 维护跨页面复用的通用组件和布局组件。
- `api/` 维护接口路径、参数与调用函数。
- `services/` 维护独立 Axios 实例、拦截器和请求基础设施。
- `stores/` 维护认证、主题等跨页面状态。
- `router/` 维护静态页面注册与路由守卫。
- `assets/styles/` 维护 token、mixin 和全局样式入口。

页面组件不应直接访问数据库，也不应复制服务端 DTO。跨端契约从 `@repo/shared` 消费。

## `apps/admin-api`

管理端独立认证边界。当前包含：

- `auth`：图片滑块、登录、会话恢复和修改密码；
- `rbac`：从数据库组装账号、角色、菜单和权限；
- `user`、`role`、`menu`、`dictionary`、`public-config`：后台系统管理；
- `common/guards`：JWT 与权限码校验；
- `prisma`：服务端数据库访问装配。

管理端 Guard、JWT 会话和超管逻辑不能被默认 C 端 API 直接复用。终端用户通常具有完全不同的身份模型和风险边界。

## `apps/api`

默认 C 端服务，只提供健康检查、公共字典和公共配置读取。真实业务与现有模块属于同一个部署边界时，可以继续在 `src/modules/` 下按领域新增模块。

只有出现独立部署、独立扩缩容、故障隔离或团队自治需求时，才考虑用 `pnpm new:server` 创建额外应用。

## `packages/database`

数据库唯一真相源，维护：

- `prisma/schema.prisma`；
- `prisma/migrations/`；
- `prisma/seed.ts`；
- 生成的 Prisma Client 与服务端数据库类型。

它是服务端专用包，浏览器应用不得导入。Prisma 模型也不能直接作为前端响应类型，需要映射为安全、稳定的共享契约。

## `packages/shared`

存放跨应用类型和不依赖浏览器框架的通用工具。服务端必须从 `@repo/shared/types` 导入共享类型，避免无意加载浏览器工具；Admin 可以按需要使用根入口、类型入口或工具入口。

只有真正跨应用共享的内容才进入该包。某个页面或单个 API 私有的类型应留在自己的应用中。

## `packages/charts`

只承载 ECharts 的按需注册、初始化和公共类型。图表的业务数据转换、具体 option、Vue 生命周期和交互留在 `apps/admin`。

## `workspace.config.json`

应用名称、类别、路径、包名、本地端口和健康检查地址都从这里读取。新增应用后不要在开发脚本中再建立一份端口表。

`pnpm dev`、`pnpm setup`、服务生成器和相关验证都会消费这份配置。

## `docs/` 与 `website/`

两者用途不同：

- `docs/` 是仓库内专题文档，记录主题系统、环境变量、部署和版本机制等实现真相。
- `website/` 是面向使用者的 Rspress 官方文档站，以任务为单位解释如何运行和扩展项目。

`website/` 不加入 `pnpm-workspace.yaml` 的 `apps/*` 或 `packages/*`，也不登记到 `workspace.config.json`。它通过根目录的 `docs:*` 脚本维护，不参与业务应用的 `pnpm dev` 调度。

## `.rules/` 与 `AGENTS.md`

`AGENTS.md` 记录编程原则、技术栈、硬性架构边界和规则索引；`.rules/` 按 Vue、TypeScript、服务端、请求层、状态、样式等任务拆分具体规范。

无论由人还是 AI 修改代码，都应先按 `AGENTS.md` 找到对应规则，再执行实现和验证。文档站解释“如何使用”，规则文件决定“代码必须怎样写”。
