---
title: 架构总览
description: 从运行应用、共享包、数据库和工程脚本四个层面理解 LY Fullstack 的模块化单体架构与依赖方向。
---

# 架构总览

LY Fullstack 是一个 Monorepo，其中包含三个可独立运行的应用和三个共享包。Monorepo 解决代码组织与协作，模块化单体解决业务边界；两者不是同一个概念。

```text
浏览器
  │
  ├── Admin ───────► Admin API ──┐
  │                               │
  └── 真实 C 端 ───► API ─────────┼──► PostgreSQL
                                  │
                      新服务 ─────┘

apps/* ─────► packages/shared
apps/* ─────► packages/database（仅服务端）
Admin ──────► packages/charts
```

## 运行单元

| 应用             | 默认端口 | 认证边界             | 当前职责                   |
| ---------------- | -------- | -------------------- | -------------------------- |
| `apps/admin`     | 8081     | 浏览器持有管理 JWT   | 管理页面、路由、状态与交互 |
| `apps/admin-api` | 3000     | 管理员账号与 RBAC    | 认证、权限与系统管理 CRUD  |
| `apps/api`       | 3001     | 当前没有终端用户认证 | 健康检查与公共读取能力     |

它们分别构建、启动和部署。独立进程不自动等于微服务：当前没有网关、服务注册发现、分布式配置、消息可靠性或链路治理。

## 共享能力

| 包               | 面向对象 | 负责什么                         | 不负责什么                      |
| ---------------- | -------- | -------------------------------- | ------------------------------- |
| `@repo/database` | 服务端   | Prisma Schema、migration、Client | 前端响应 DTO、NestJS 模块       |
| `@repo/shared`   | 前后端   | 安全共享类型、无框架工具         | 应用业务、数据库生成类型        |
| `@repo/charts`   | Admin    | ECharts 注册、初始化、公共类型   | 页面组件、业务 option、数据请求 |

## 工程控制面

- `workspace.config.json`：应用注册和本地端口真相源。
- `scripts/setup.mjs`：本地数据库、环境文件、migration 和 seed。
- `scripts/dev.mjs`：选择应用、注入端口、启动与停止进程。
- `scripts/check-architecture.mjs`：机器化检查依赖与目录边界。
- `turbo.json`：编排 workspace 包的构建、类型检查和测试。
- `.github/workflows/ci.yml`：Pull Request 与 main 的质量和集成门禁。

## 请求链路示例

管理员访问用户管理页面时：

1. Admin 路由守卫检查本地是否存在 Token。
2. 首次进入受保护页面时调用 `/api/auth/me` 恢复会话。
3. Admin API 的 JWT Guard 读取 Token 中的账号标识与 `tokenVersion`。
4. Guard 从数据库重新读取账号、角色、菜单和权限状态。
5. Permission Guard 检查当前接口声明的权限码。
6. Controller 调用 Service，Service 通过 Prisma 访问 PostgreSQL。
7. 响应映射为共享契约，Admin composable 更新页面状态。

这条链路确保权限不是只靠前端菜单隐藏。

## 继续阅读

- [为什么是模块化单体](/architecture/modular-monolith)
- [项目边界](/architecture/boundaries)
- [认证与 RBAC](/architecture/auth-rbac)
