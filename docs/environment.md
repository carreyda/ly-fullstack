# 环境配置

仓库只提交以下两个无密钥模板，用来声明各应用支持的环境变量：

- `apps/admin/.env.example`
- `apps/admin-api/.env.example`

development、test、production 六个运行环境文件全部由 `pnpm setup` 在开发者本地生成，并由根 `.gitignore` 忽略。仓库根目录不创建 `.env`，避免不同应用共享或误读同一份私密配置。

## 自动初始化

首次启动前在仓库根目录执行：

```bash
pnpm setup
```

初始化过程会：

1. 以隐藏输入方式收集本地 PostgreSQL 的 `postgres` 用户密码。
2. 询问数据库名称；直接回车使用 `ly_fullstack`，也可以填写其他名称。
3. 本机 `127.0.0.1:5432` 已有 PostgreSQL 时直接复用，否则把本次输入仅注入 Docker Compose 子进程并启动 PostgreSQL。
4. 幂等创建目标数据库。
5. 为 Admin 与 Admin API 分别生成 `.env.development`、`.env.test`、`.env.production`。
6. 执行全部 Prisma migration 创建或更新表结构。
7. 初始化 RBAC 数据与默认管理员；首次创建时账号为 `admin`，密码为 `admin123`，重复执行不会重置已有账号密码。

再次执行时，只要六个运行环境文件中有任意一个已经存在，脚本就会先请求确认，不会静默覆盖本地数据库连接和 JWT 密钥。

## 六个运行环境文件

Setup 生成的文件及初始内容策略如下：

| 应用      | 环境        | Setup 生成策略                                                                 |
| --------- | ----------- | ------------------------------------------------------------------------------ |
| admin     | development | 写入 `APP_ENV=development`，API 指向本地 `admin-api`                           |
| admin     | test        | 写入 `APP_ENV=test`，API 使用同源 `/api`                                       |
| admin     | production  | 写入 `APP_ENV=production`，API 使用同源 `/api`                                 |
| admin-api | development | 写入本地数据库连接、Admin 跨域来源、随机 JWT 密钥；端口由开发启动器注入        |
| admin-api | test        | 生成完整变量结构，数据库、跨域、JWT 与端口留空，等待 CI 或测试运行环境注入     |
| admin-api | production  | 生成完整变量结构，数据库、跨域、JWT 与端口留空，等待部署平台或容器运行环境注入 |

Admin 根据 Rsbuild 的 `--env-mode` 读取对应文件，并校验文件内 `APP_ENV` 与构建模式一致。Admin API 根据进程中的 `APP_ENV` 只读取自身目录的 `.env.<环境>`，不会回退读取仓库根 `.env`。

## 环境变量

| 应用      | 变量             | 用途                                                         |
| --------- | ---------------- | ------------------------------------------------------------ |
| admin     | `APP_ENV`        | 当前构建环境，必须是 `development`、`test` 或 `production`   |
| admin     | `API_BASE_URL`   | 管理 API 地址；本地指向 3000 端口，部署时通常使用同源 `/api` |
| admin-api | `DATABASE_URL`   | PostgreSQL 连接串                                            |
| admin-api | `CORS_ORIGINS`   | 允许访问管理 API 的浏览器来源，多个来源使用英文逗号分隔      |
| admin-api | `JWT_SECRET`     | 管理端 JWT 签名密钥                                          |
| admin-api | `JWT_EXPIRES_IN` | Access Token 有效期                                          |
| admin-api | `PORT`           | 本地由开发启动器注入，部署时由容器或平台注入                 |

进程环境变量的优先级高于 `.env.<环境>`。因此 CI/CD 与部署平台可以直接注入 test、production 的真实值，不需要修改本地生成文件，更不能把真实密码或密钥提交到 Git。

## Compose 与根目录环境文件

`pnpm setup` 启动 Compose 时，会把 `POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`、`POSTGRES_PORT` 仅传给当前 Docker 子进程。脚本不会把这些值写入根 `.env`。

如需绕过 Setup 手动启动 Compose，必须先在当前终端显式设置 `POSTGRES_PASSWORD`。PowerShell 示例：

```powershell
$env:POSTGRES_PASSWORD = '<本地数据库密码>'
docker compose up -d postgres
```

也可以同时通过进程环境变量覆盖 `POSTGRES_DB`、`POSTGRES_USER` 和 `POSTGRES_PORT`。日常仍应优先使用幂等的 `pnpm setup`，因为直接启动 PostgreSQL 容器不会替你执行 migration 和 seed。

仓库使用 PostgreSQL 18 的 `ly-fullstack-postgres-18-data` 数据卷。它与旧版 PostgreSQL 17 的 `ly-fullstack-postgres-data` 分开，升级不会静默覆盖旧数据；需要迁移旧数据库时应通过 `pg_dump` / `pg_restore` 显式迁移，确认无误后再自行删除旧卷。

## 手动配置

不使用初始化脚本时，可以参照两个 `.env.example` 手动创建六个 `.env.<环境>` 文件，但它们仍不得提交。新增环境变量时，必须同时更新对应 `.env.example`、`scripts/setup.mjs` 的生成逻辑和本文档，避免模板与运行配置漂移。

## 新生成的服务

`pnpm new:server` 创建的服务默认不依赖数据库，只读取 `CORS_ORIGINS` 与必填的 `PORT`。本地端口来自 `workspace.config.json`；服务需要数据库、JWT 或其他密钥时，应在该应用中补充 `.env.example`、环境类型和配置文档，不要与 admin-api 共用私密配置。

LY Fullstack 项目组
