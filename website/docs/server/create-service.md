---
title: 创建独立服务
description: 使用 pnpm new:server 生成并注册新的 NestJS + Fastify 服务，理解生成内容、端口约束、后续数据库接入与服务治理边界。
---

# 创建独立服务

只有功能需要独立部署、扩缩容、故障隔离或团队自治时，才创建新的服务端应用。

## 运行生成器

在仓库根目录执行：

```bash
pnpm new:server
```

生成器询问：

1. **服务名称**：必须是 kebab-case，例如 `content-api`。
2. **本地端口**：1–65535 之间，不能与注册表中的现有应用冲突。

默认建议端口从 3001 开始向后查找第一个空位。

## 生成结果

输入 `content-api` 和 `3002` 后，生成器会：

1. 从 `scripts/templates/server` 创建 `apps/content-api`；
2. 使用包名 `@repo/content-api`；
3. 写入 `workspace.config.json` 的 `apps.server.content-api`；
4. 运行 Prettier 和 `pnpm install`；
5. 执行新服务的类型检查、测试和构建。

模板只包含健康检查、Fastify 启动、CORS、Helmet 和基本测试，不预设数据库、JWT 或业务模块。

## 启动新服务

注册完成后，它会自动出现在 `pnpm dev` 的服务列表中：

```bash
pnpm dev content-api
curl http://localhost:3002/api/health
```

根启动器会从 `workspace.config.json` 注入 `PORT`，服务源码不需要维护默认端口。

## 接入数据库

确实需要 PostgreSQL 时：

1. 在新应用安装 `@repo/database` 和 Prisma adapter 等现有 catalog 依赖；
2. 参考 `apps/api/src/prisma` 创建该应用自己的 `PrismaModule` 与 `PrismaService`；
3. 从 `@repo/database` 使用 Client，不复制 Schema；
4. 为新服务建立独立 `.env.example` 与被忽略的运行环境文件；
5. 把数据库模块装配到根模块。

`packages/database` 不能依赖 NestJS，所以不要把 `PrismaModule` 上移到数据库包。

## 接入认证

不要直接复制 Admin JWT Guard。先回答：

- 谁是登录主体；
- Token 如何签发、刷新和撤销；
- 是否需要设备、租户或第三方身份；
- 服务之间如何传播身份；
- 哪些接口允许匿名访问。

认证设计完成后再实现适合该服务的 Guard 和会话模型。

## 创建服务不等于完成微服务

生成器没有提供：

- API 网关；
- 服务注册与发现；
- 服务间重试、熔断和幂等；
- 消息队列与一致性方案；
- 分布式追踪、配置中心和部署编排。

如果新服务需要与其他服务通信，这些能力必须按真实链路补充，并明确超时后的结果语义。不要把网络调用当作普通函数调用。

## 最终检查

```bash
pnpm check:architecture
pnpm --filter @repo/content-api typecheck
pnpm --filter @repo/content-api test
pnpm --filter @repo/content-api build
pnpm check
```

同时确认新端口、健康检查和部署配置都只从应用注册表或环境变量读取，没有第二份默认值。
