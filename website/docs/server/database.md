---
title: 数据库与迁移
description: 使用 packages/database 维护 Prisma Schema、开发迁移、生成 Client、Seed、生产 migrate deploy，并处理安全变更与回滚。
---

# 数据库与迁移

`packages/database` 是 PostgreSQL 结构的唯一真相源。所有 NestJS 应用共享这里的 Schema 和 migration，但各自维护运行时 Prisma 装配与环境配置。

## 目录

```text
packages/database/
├── prisma/schema.prisma
├── prisma/migrations/
├── prisma/seed.ts
├── prisma.config.ts
├── generated/prisma/       # 本地生成，不提交
└── src/index.ts             # 服务端公共出口
```

## 首次初始化

日常首次运行优先使用：

```bash
pnpm setup
```

它会创建数据库、生成服务端开发环境文件、执行已有 migration 并运行幂等 Seed。不要把“启动 PostgreSQL”和“数据库已经完成初始化”混为一谈。

## 修改 Schema

1. 编辑 `packages/database/prisma/schema.prisma`。
2. 检查字段可空性、默认值、唯一约束、索引和关系删除行为。
3. 在本地开发数据库上生成 migration。
4. 审查生成 SQL。
5. 重新生成 Client 并运行受影响测试。

本地环境文件由 Setup 生成后，可以通过根目录已安装的 `dotenv-cli` 将连接串注入 Prisma：

```bash
pnpm exec dotenv -e apps/admin-api/.env.development -- pnpm --filter @repo/database exec prisma migrate dev --name add_product
pnpm --filter @repo/database generate
```

`--name` 使用能表达业务变更的英文 kebab-case 或 snake_case 名称，不使用 `update`、`change` 这类无法追踪意图的笼统词。

:::warning 先审查 migration SQL
Prisma 能生成 SQL，不代表 SQL 对已有生产数据一定安全。新增非空字段、修改唯一约束、删除列和大表索引都需要根据真实数据量设计迁移步骤。
:::

## 生成 Prisma Client

```bash
pnpm --filter @repo/database generate
```

`pnpm install`、database typecheck 和 database build 也会执行生成。生成目录不提交 Git，不手工修改。Schema 变化后应重启正在运行的 API 进程。

## Seed

Seed 初始化超级管理员角色、菜单权限和 `admin` 账号。首次生产 Seed 需要显式注入：

```bash
ADMIN_INITIAL_PASSWORD='<强密码>' pnpm --filter @repo/database db:seed
```

在 PowerShell 中应先设置当前进程环境变量再执行。不要把密码写入脚本、文档示例的真实值或 Git 历史。

Seed 是幂等的：已存在的 `admin` 不会被重置密码。修改现有密码应走后台业务流程。

## 生产迁移

生产发布只执行仓库中已经审查并提交的 migration：

```bash
pnpm --filter @repo/database db:migrate
```

该脚本使用 `prisma migrate deploy`。运行前必须由部署环境注入 `DATABASE_URL`；迁移失败时停止发布，不继续切换版本或重启应用。

## 安全迁移原则

破坏性变更优先使用“扩展—迁移—收缩”：

1. 先新增兼容字段或表。
2. 发布同时兼容新旧结构的应用。
3. 后台迁移历史数据并验证。
4. 切换所有读写到新结构。
5. 在后续版本删除旧字段。

数据库 migration 不会随着应用代码回滚自动反向执行。发布前应备份，并让 Schema 至少兼容前后两个应用版本。

## 验证

```bash
pnpm --filter @repo/database typecheck
pnpm --filter @repo/database build
pnpm verify:setup
```

`verify:setup` 会真实查询默认管理员、超级管理员关系和菜单数据，适合在 Setup 或 CI 初始化后确认数据库闭环。
