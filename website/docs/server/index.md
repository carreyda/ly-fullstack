---
title: 服务端总览
description: 了解 Admin API、默认 C 端 API、NestJS 模块结构、Fastify 启动、Prisma 数据访问、环境配置与服务间隔离原则。
---

# 服务端总览

仓库默认包含两个 NestJS 11 + Fastify 5 应用。它们复用数据库和安全共享类型，但拥有独立进程、端口、CORS 和认证边界。

| 应用             | 包名              | 默认端口 | 当前能力                           |
| ---------------- | ----------------- | -------- | ---------------------------------- |
| `apps/admin-api` | `@repo/admin-api` | 3000     | 管理登录、RBAC、系统管理和健康检查 |
| `apps/api`       | `@repo/api`       | 3001     | 健康检查、公共字典和公共配置读取   |

## 标准目录

```text
apps/<service>/src/
├── main.ts
├── constants/
│   ├── index.ts
│   └── modules/
├── modules/
│   └── <domain>/
│       ├── dto/
│       ├── <domain>.controller.ts
│       ├── <domain>.module.ts
│       └── <domain>.service.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/
└── types/
```

根 `AppModule` 只装配模块，不承载业务逻辑。Controller 负责 HTTP 边界，Service 负责业务规则和数据库访问，DTO 负责输入结构校验。

## 启动期公共能力

两个服务都：

- 使用 Fastify Adapter；
- 注册 `@fastify/helmet`；
- 使用全局 `/api` 前缀；
- 从 `CORS_ORIGINS` 建立明确浏览器来源白名单；
- 启用 Shutdown Hooks，关闭时释放 Prisma 连接；
- 从环境读取必填 `PORT`，不在源码维护本地默认值。

Admin API 额外注册全局 `ValidationPipe`，使用白名单、拒绝额外字段并转换 DTO。开发环境由 `tsx` 运行，Controller 的 `@Body` 和 `@Query` 需要按项目规则显式传递 DTO 类型，保证开发与生产校验一致。

## 数据访问

Schema、migration、seed 和生成 Client 都属于 `@repo/database`。每个实际访问数据库的 NestJS 应用在自己的 `src/prisma` 中装配 `PrismaService`，从而避免让数据库包依赖 NestJS。

业务模块只注入 `PrismaService`，不自行建立 `pg` 连接池，也不在 Controller 直接写 Prisma 查询。

## 共享类型

服务端从 `@repo/shared/types` 导入跨端契约。不要从 `@repo/shared` 根入口导入浏览器工具，也不要跨应用导入另一个服务的内部类型。

类型归属判断：

- 前后端都消费：`packages/shared/src/types`；
- 多个服务端文件消费但不跨应用：当前应用 `src/types`；
- 单个 DTO 的校验输入：模块 `dto/`；
- 数据库生成类型：只在服务端通过 `@repo/database` 使用。

## 选择下一步

- 在现有 C 端服务增加领域：[新增业务模块](/server/extend-api)
- 了解已有匿名接口：[默认 C 端 API](/server/public-api)
- 确实需要独立运行单元：[创建独立服务](/server/create-service)
- 修改 Schema：[数据库与迁移](/server/database)
