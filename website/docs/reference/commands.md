---
title: 命令速查
description: 汇总 LY Fullstack 的依赖安装、Setup、应用启停、服务生成、数据库、类型检查、测试、构建、E2E 与 Rspress 文档命令。
---

# 命令速查

除非特别说明，所有命令都从仓库根目录执行。

## 安装与初始化

| 命令                           | 用途                               | 备注                   |
| ------------------------------ | ---------------------------------- | ---------------------- |
| `pnpm install`                 | 安装全仓依赖                       | 自动生成 Prisma Client |
| `pnpm setup`                   | 初始化本地数据库、环境文件和管理员 | 交互模式               |
| `pnpm setup --non-interactive` | 在 CI 执行同一初始化流程           | 通过环境变量传密码     |
| `pnpm verify:setup`            | 查询数据库验证 migration 与 Seed   | 需要 `DATABASE_URL`    |

## 开发启动

| 命令                           | 用途                       |
| ------------------------------ | -------------------------- |
| `pnpm dev`                     | 交互选择服务端与前端应用   |
| `pnpm dev all`                 | 启动注册表中的全部应用     |
| `pnpm dev api admin-api admin` | 启动指定组合               |
| `pnpm dev:admin`               | 单独启动 Admin             |
| `pnpm dev:admin-api`           | 单独启动管理 API           |
| `pnpm dev:api`                 | 单独启动默认 C 端 API      |
| `pnpm dev:stop`                | 停止仓库开发启动器遗留进程 |

## 创建应用

| 命令              | 用途                                   |
| ----------------- | -------------------------------------- |
| `pnpm new:server` | 生成、注册并验证 NestJS + Fastify 服务 |

Web 客户端没有统一生成器。根据真实需求选择 Nuxt、Next.js、Vue、React、小程序等方案，再决定是否加入当前 Monorepo。

## 数据库

| 命令                                      | 用途                       |
| ----------------------------------------- | -------------------------- |
| `pnpm --filter @repo/database generate`   | 生成 Prisma Client         |
| `pnpm --filter @repo/database db:migrate` | 生产执行已有 migration     |
| `pnpm --filter @repo/database db:seed`    | 初始化幂等 Seed            |
| `pnpm --filter @repo/database build`      | 生成 Client 并构建数据库包 |

开发生成新 migration 见[数据库与迁移](/server/database)，不要在生产运行 `prisma migrate dev`。

## 质量检查

| 命令                      | 用途                        |
| ------------------------- | --------------------------- |
| `pnpm check:architecture` | 检查架构依赖和目录边界      |
| `pnpm typecheck`          | 全仓与 E2E TypeScript 检查  |
| `pnpm lint`               | ESLint 检查                 |
| `pnpm lint:fix`           | 自动修复可修复 lint 问题    |
| `pnpm format:check`       | 检查 Prettier 格式          |
| `pnpm format`             | 写入 Prettier 格式          |
| `pnpm test`               | 模板测试与全仓 Rstest       |
| `pnpm test:e2e`           | Playwright 关键流程冒烟测试 |
| `pnpm build`              | 构建 apps 与 packages 产物  |
| `pnpm check`              | 完整门禁，并构建官方文档站  |

## 按包验证

```bash
pnpm --filter @repo/admin typecheck
pnpm --filter @repo/admin test
pnpm --filter @repo/admin build:prod

pnpm --filter @repo/admin-api typecheck
pnpm --filter @repo/admin-api test
pnpm --filter @repo/admin-api build

pnpm --filter @repo/api typecheck
pnpm --filter @repo/api test
pnpm --filter @repo/api build
```

按包命令适合开发中的快速反馈，合并前仍执行 `pnpm check`。

## 官方文档站

| 命令                | 用途                                    |
| ------------------- | --------------------------------------- |
| `pnpm docs:dev`     | 启动 Rspress 开发服务器                 |
| `pnpm docs:build`   | 构建静态站、页面 Markdown 和 `llms.txt` |
| `pnpm docs:preview` | 预览 `website/doc_build` 生产产物       |

`website/` 不是 workspace 业务子包，因此没有自己的 `package.json`。Rspress 版本和脚本由仓库根统一维护。

## 清理

```bash
pnpm clean
```

该命令调用 workspace 包的 clean 任务。文档输出 `website/doc_build` 被 Git 忽略，可在需要时单独删除后重新构建；不要删除源码目录或数据库数据。
