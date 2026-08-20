# 环境配置

当前需要数据库配置的应用只有 `apps/admin-api`。它根据 `APP_ENV` 读取自身目录下的 `.env.<环境>` 文件；开发启动器会设置 `APP_ENV=development`，并根据根 `workspace.config.json` 注入本地 `PORT`。

首次启动前在仓库根目录执行：

```bash
pnpm setup
```

初始化过程会：

1. 以隐藏输入方式收集本地 PostgreSQL 的 `postgres` 用户密码。
2. 询问数据库名称；直接回车使用 `ly_fullstack`，也可以填写其他名称。
3. 生成被 Git 忽略的根 `.env`，供 `compose.yaml` 读取 PostgreSQL 配置。
4. 本机 `127.0.0.1:5432` 已有服务时直接复用，否则通过 Docker Compose 启动 PostgreSQL。
5. 在数据库不存在时创建数据库。
6. 生成被 Git 忽略的 `apps/admin-api/.env.development`。

再次执行时，如果本地环境文件已经存在，脚本会先请求确认，不会静默覆盖已有密码和配置。

## 手动配置

不使用初始化脚本时，可以手动创建 `apps/admin-api/.env.development`：

```dotenv
DATABASE_URL="postgresql://<用户名>:<密码>@localhost:<端口>/<数据库名>?schema=public"
CORS_ORIGINS="http://localhost:8081,http://127.0.0.1:8081"
```

端口不写入该文件。`pnpm dev` 会从 `workspace.config.json` 读取 `admin-api.localPort` 并通过进程环境变量注入；测试、生产、容器或部署平台也必须显式注入 `PORT`。

还需要在仓库根目录创建供 Compose 使用的 `.env`：

```dotenv
POSTGRES_DB="ly_fullstack"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="<本地数据库密码>"
POSTGRES_PORT=5432
```

完成配置后执行 `docker compose up -d postgres`。PostgreSQL 官方镜像只会在数据卷首次初始化时根据 `POSTGRES_DB` 自动建库；已有数据卷需要自行创建新数据库，因此日常优先使用幂等的 `pnpm setup`。

仓库使用 PostgreSQL 18 的 `ly-fullstack-postgres-18-data` 数据卷。它与旧版 PostgreSQL 17 的 `ly-fullstack-postgres-data` 分开，升级不会静默覆盖旧数据；需要迁移旧数据库时应通过 `pg_dump` / `pg_restore` 显式迁移，确认无误后再自行删除旧卷。

根 `.env` 与 `apps/admin-api/.env.development` 都已被 `.gitignore` 忽略，可以保存本地数据库密码和后续加入的 JWT 密钥，但仍应在提交前使用 `git status` 确认它们没有进入暂存区。

## 环境变量

| 应用      | 变量           | 用途                                                       |
| --------- | -------------- | ---------------------------------------------------------- |
| admin     | `API_BASE_URL` | 管理 API 地址；本地模板已指向 `http://localhost:3000/api`  |
| admin-api | `DATABASE_URL` | PostgreSQL 连接串，本地开发必须填写                        |
| admin-api | `CORS_ORIGINS` | 允许访问管理 API 的浏览器来源，多个来源使用逗号分隔        |
| admin-api | `PORT`         | 必填；本地由配置驱动的开发启动器注入，部署时由运行环境注入 |

## 新生成的服务

`pnpm new:server` 创建的服务默认不依赖数据库，只读取 `CORS_ORIGINS` 与必填的 `PORT`。本地端口来自 `workspace.config.json`；服务需要数据库、JWT 或其他密钥时，应在该应用中补充 `.env.example`、环境类型和配置文档，不要与 admin-api 共用私密配置。

## 测试与生产环境

仓库中的 `.env.test` 和 `.env.production` 只维护变量名，值保持为空，不得写入真实密码或密钥。CI/CD、容器或部署平台应通过进程环境变量注入真实配置；Node.js 进程环境变量的优先级高于文件中的空模板。

`scripts/setup.mjs` 只把用户本次输入写入本机忽略文件，不会内置、输出或提交真实密码。

LY Fullstack 项目组
