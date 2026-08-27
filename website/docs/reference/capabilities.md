---
title: 能力边界
description: 明确 LY Fullstack 当前已经实现的管理后台、认证、RBAC、API、数据库、服务生成与工程能力，以及尚未完成的业务。
---

# 能力边界

开源项目的可信度来自准确描述。下表以当前仓库代码为准，不把路线图、演示数据或可扩展性宣传成已经交付的功能。

## 已实现

### 管理后台

- 可折叠侧栏、Header、窄屏抽屉和路由布局。
- 工作台、系统管理、组件展示、成功/失败/404/500 页面。
- 深浅主题、默认跟随系统、用户选择持久化和切换动画。
- 统一请求层、Token 注入、401 处理与 UI 反馈装配。

### 认证与权限

- 真实账号密码登录和会话恢复。
- 服务端一次性图片滑块验证与基础限流。
- JWT + `tokenVersion` 撤销旧会话。
- User、Role、Menu、UserRole、RoleMenu 五表 RBAC。
- 动态数据库菜单、按钮权限和服务端 Permission Guard。
- 用户、角色、菜单的保护规则与分配流程。

### 系统管理

- 用户、角色、菜单、字典和公共配置的分页、筛选、新增、编辑与删除。
- 角色菜单授权、用户角色分配、用户密码重置。
- 菜单页面绑定、排序和标准权限生成。

### 默认 C 端 API

- 独立 NestJS + Fastify 应用。
- 健康检查。
- 按 code 读取启用字典和字典项。
- 按 key 读取单条启用公共配置。

### 数据与工程

- PostgreSQL 17 + Prisma 7 Schema、migration 和 Seed。
- 交互式与 CI 共用的 Setup 流程。
- pnpm workspace、Turborepo 和 workspace catalog。
- 服务生成器、架构检查、类型检查、Lint、格式、Rstest、Playwright 和 GitHub Actions。
- Admin 版本检测、Service Worker 静态缓存和更新提示。
- Rspress 官方文档站及 AI 可读 `llms.txt` 输出。

## 当前未实现

- 任何具体 C 端客户端。
- 终端用户注册、登录和授权。
- 订单、支付、内容、电商、IM 等具体产品业务。
- API 网关、服务发现、分布式事务、配置中心和完整微服务治理。
- 真实监控采集；Dashboard 指标是演示数据。
- 已连接真实服务器的自动 CD。
- 通用 Web 应用生成器。

## 可以扩展但不代表已经拥有

项目可以作为以下工作的起点：

- 在 `apps/api` 增加真实领域模块；
- 创建独立 NestJS 服务；
- 选择 Nuxt、Next.js、小程序或其他 C 端；
- 接入 Redis、对象存储、队列和监控；
- 迁移到容器或 Kubernetes。

这些都是合理演进方向，但只有完成设计、代码、测试和部署验收后，才能成为你的项目能力。

## 版本判断原则

使用项目时以当前 Tag/Commit 的：

- `README.md`；
- `CHANGELOG.md`；
- `docs/releases/`；
- 实际代码和测试；
- CI 状态

为依据。路线图描述未来方向，不是当前承诺。
