# 环境配置

环境配置按“契约进仓库、运行值由环境所有者注入”的原则维护。仓库只提交以下两个无密钥模板：

- `apps/admin/.env.example`
- `apps/admin-api/.env.example`

任何 `.env.development`、`.env.test`、`.env.production` 和根 `.env` 都被 Git 忽略。文件不进入 Git 不会阻碍自动化部署，因为 NestJS 和 Rsbuild 都可以直接读取 CI/CD 注入的进程环境变量。

## 环境责任边界

| 环境        | 配置提供方         | 推荐载体                                    | 是否由 `pnpm setup` 生成 |
| ----------- | ------------------ | ------------------------------------------- | ------------------------ |
| development | 开发者本机         | 两个应用各自的 `.env.development`           | 是                       |
| test        | 测试任务或 CI      | CI 进程环境变量；本地集成测试可临时创建文件 | 否                       |
| production  | CD、容器或部署平台 | Secret、容器环境变量或服务器私有文件        | 否                       |

`.env.example` 只声明变量名称、用途和安全示例，不承担任何环境的真实运行配置。test 与 production 不在本地提前生成空文件，因为空文件既不能部署，也容易让人误以为配置已经完成。

## 本地开发

当前磁盘上没有 `.env.development` 时，说明尚未执行本地初始化。首次启动前在仓库根目录运行：

```bash
pnpm setup
```

初始化过程会：

1. 以隐藏输入方式收集本地 PostgreSQL 的 `postgres` 用户密码。
2. 询问数据库名称；直接回车使用 `ly_fullstack`，也可以填写其他名称。
3. 本机 `127.0.0.1:5432` 已有 PostgreSQL 时直接复用，否则把本次输入仅注入 Docker Compose 子进程并启动 PostgreSQL。
4. 幂等创建目标数据库。
5. 生成 `apps/admin/.env.development` 和 `apps/admin-api/.env.development`。
6. 执行全部 Prisma migration 创建或更新表结构。
7. 初始化 RBAC 数据与默认管理员；首次创建时账号为 `admin`，密码为 `admin123`，重复执行不会重置已有账号密码。

再次执行时，只要两份 development 文件中有任意一份已经存在，脚本就会先请求确认，不会静默覆盖本地数据库连接和 JWT 密钥。

Admin 的 development 文件包含：

```dotenv
APP_ENV=development
API_BASE_URL=http://127.0.0.1:3000/api
```

Admin API 的 development 文件包含 `DATABASE_URL`、`CORS_ORIGINS`、随机生成的 `JWT_SECRET` 和 `JWT_EXPIRES_IN`。本地 `PORT` 不写入文件，由 `scripts/dev.mjs` 根据 `workspace.config.json` 注入，避免端口出现两个真相源。

## 测试环境

普通单元测试不需要为了形式创建 `.env.test`。需要数据库或完整应用启动的集成测试，由测试任务或 CI 注入对应变量：

```text
APP_ENV=test
API_BASE_URL=/api
DATABASE_URL=<测试数据库连接串>
CORS_ORIGINS=<测试前端来源>
JWT_SECRET=<测试专用随机密钥>
JWT_EXPIRES_IN=7d
PORT=<测试服务端口>
```

如果开发者需要在本地运行完整测试环境，可以手动创建被 Git 忽略的 `.env.test`，但不能复用生产密钥，也不能提交该文件。

## 生产环境与自动化部署

当前仓库尚未配置 `.github/workflows`，因此本节定义的是后续自动化部署必须遵守的环境变量契约，并不代表 CD 已经落地。实际工作流需要在确定 Docker、Kubernetes、云平台或 SSH + PM2 等部署目标后实现。

管理后台在构建阶段需要：

```text
APP_ENV=production
API_BASE_URL=/api
```

根 `turbo.json` 已把这两个变量声明为构建输入，因此从根目录执行 `pnpm build` 时，Turborepo 会把 CI 注入的值传给 Admin 构建，并按变量值区分缓存。

Admin API 在运行阶段需要：

```text
DATABASE_URL=<生产数据库连接串>
CORS_ORIGINS=<生产管理后台来源>
JWT_SECRET=<生产随机密钥>
JWT_EXPIRES_IN=7d
PORT=<生产服务端口>
```

`start:prod` 会设置 `APP_ENV=production`。NestJS 会优先使用部署平台注入的进程环境变量；应用目录中不存在 `.env.production` 也可以正常启动。缺少必填变量时应直接启动失败，不能回退到 development 或仓库根配置。

推荐部署方式按优先级排列：

1. 容器、Kubernetes 或云平台通过 Secret 和环境变量直接注入，不生成文件。
2. PM2、Systemd 等服务器部署由 CD 在目标服务器生成仅部署用户可读的 `.env.production`。
3. 禁止在 CI 工作区长期保存生产文件，禁止把生产文件打进前端静态产物或提交到 Git。

## Compose 与根目录环境文件

`pnpm setup` 启动 Compose 时，会把 `POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`、`POSTGRES_PORT` 仅传给当前 Docker 子进程。脚本不会把这些值写入根 `.env`。

如需绕过 Setup 手动启动 Compose，必须先在当前终端显式设置 `POSTGRES_PASSWORD`。PowerShell 示例：

```powershell
$env:POSTGRES_PASSWORD = '<本地数据库密码>'
docker compose up -d postgres
```

日常仍应优先使用幂等的 `pnpm setup`，因为直接启动 PostgreSQL 容器不会执行 migration 和 seed。

## 环境变量契约

| 应用      | 变量             | 用途                                                       |
| --------- | ---------------- | ---------------------------------------------------------- |
| admin     | `APP_ENV`        | 当前构建环境，必须是 `development`、`test` 或 `production` |
| admin     | `API_BASE_URL`   | 管理 API 地址；本地指向注册端口，部署时通常使用同源 `/api` |
| admin-api | `DATABASE_URL`   | PostgreSQL 连接串                                          |
| admin-api | `CORS_ORIGINS`   | 允许访问管理 API 的浏览器来源，多个来源使用英文逗号分隔    |
| admin-api | `JWT_SECRET`     | 管理端 JWT 签名密钥                                        |
| admin-api | `JWT_EXPIRES_IN` | Access Token 有效期                                        |
| admin-api | `PORT`           | 本地由开发启动器注入，部署时由容器或平台注入               |

新增环境变量时，必须同步更新对应 `.env.example`、本地需要的 `scripts/setup.mjs` 生成逻辑、CI/CD 配置和本文档，避免契约与运行环境漂移。

LY Fullstack 项目组
