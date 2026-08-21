# LY Fullstack

面向开源展示与未来 B2B 项目的全栈 Monorepo 底座。当前只维护一套管理系统：管理后台 `apps/admin` 与管理服务 `apps/admin-api`；新的 C 端或业务服务通过 NestJS 模板按需生成，不预先保留空应用。

当前处于 **M1 工程骨架阶段**：Admin 外壳、管理 API 健康检查、服务生成器、共享包、数据库包与工程基线已经就绪；登录认证、五表 RBAC 与业务 CRUD 将在后续阶段接入。

## 技术栈

| 领域     | 选型                                                                |
| -------- | ------------------------------------------------------------------- |
| 管理后台 | Rsbuild 2 + Vue 3 + TypeScript + Element Plus + SCSS                |
| 管理 API | NestJS 11 + Fastify + ValidationPipe                                |
| 数据层   | `@repo/database` + PostgreSQL 18 + Prisma 7（driver adapter 模式）  |
| 共享包   | `@repo/shared`（跨应用类型与无 UI 框架通用工具）                    |
| 图表包   | `@repo/charts`（ECharts 按需注册、初始化与公共类型）                |
| 工程基线 | pnpm workspace + Turborepo + ESLint + Prettier + Husky + commitlint |
| 测试     | Rstest                                                              |

## 快速开始

环境要求：Node.js >= 22.19、pnpm >= 11 < 12（根目录 `packageManager` 已固定），以及用于本地 PostgreSQL 的 Docker 或现有 PostgreSQL 服务。

```bash
# 1. 安装依赖（会自动执行 prisma generate）
pnpm install

# 2. 输入本地数据库密码并初始化 PostgreSQL 与环境文件
pnpm setup

# 3. 选择要启动的应用
pnpm dev
```

`pnpm setup` 会询问 PostgreSQL 密码与数据库名（默认 `ly_fullstack`）。本机 `127.0.0.1:5432` 已有服务时直接复用，否则通过 Docker Compose 启动 PostgreSQL。随后脚本创建数据库和表结构、初始化默认管理员，并为 `admin`、`admin-api` 生成两份本地 `.env.development`。test 与 production 配置由 CI/CD 或部署平台注入，不在本地 Setup 中伪造空文件。仓库只提交两个 `.env.example`，运行文件与数据库密码均不会进入 Git，也不会生成根 `.env`。完整说明见 [`docs/environment.md`](docs/environment.md)。

本地地址由根 [`workspace.config.json`](workspace.config.json) 统一维护：

- 管理后台：http://localhost:8081
- 管理 API：http://localhost:3000/api/health

`pnpm dev` 会根据配置表先多选服务端应用，再选择前端应用。也可以使用 `pnpm dev all` 启动全部应用，或用 `pnpm dev admin-api admin` 非交互启动指定组合。

## 新建服务

需要 C 端 API 或其他独立服务时，在根目录执行：

```bash
pnpm new:server
```

生成器会询问服务名与本地端口，然后完成四件事：

1. 从 `scripts/templates/server` 创建仅含健康检查的 NestJS + Fastify 服务。
2. 使用 `@repo/<服务名>` 作为包名。
3. 将服务登记到 `workspace.config.json` 的 `apps.server`。
4. 安装依赖，并验证新服务的类型、测试与构建。

例如输入 `api` 与 `3001` 会创建 `apps/api`，之后它会自动出现在 `pnpm dev` 的服务列表中。模板不预置数据库、JWT 或业务模块；C 端认证和管理端认证属于不同应用边界，应在真实需求出现后分别实现。

主站前端不提供生成器。主站可能选择 Nuxt、Next.js 或其他 SSR/CSR 技术栈，确定技术方案后手动创建应用，再登记到 `workspace.config.json` 的 `apps.web`。

## 常用命令

| 命令                 | 说明                                           |
| -------------------- | ---------------------------------------------- |
| `pnpm setup`         | 初始化数据库、种子数据与两份本地开发环境文件   |
| `pnpm new:server`    | 生成并注册新的 NestJS + Fastify 服务           |
| `pnpm dev`           | 根据配置表交互选择服务端和前端应用             |
| `pnpm dev all`       | 非交互启动配置表中的全部应用                   |
| `pnpm dev:admin`     | 单独启动 admin                                 |
| `pnpm dev:admin-api` | 单独启动 admin-api                             |
| `pnpm dev:stop`      | 停止本仓库遗留的开发进程                       |
| `pnpm typecheck`     | 全仓类型检查                                   |
| `pnpm lint`          | ESLint 检查（`lint:fix` 自动修复）             |
| `pnpm format`        | Prettier 格式化（`format:check` 仅检查）       |
| `pnpm test`          | 服务模板冒烟测试与全仓 Rstest 单元测试         |
| `pnpm build`         | 构建全部产物                                   |
| `pnpm check`         | typecheck + lint + format:check + test + build |

## 目录结构

```text
ly-fullstack/
├── apps/
│   ├── admin/                 # 管理后台（Rsbuild + Vue 3 + Element Plus）
│   └── admin-api/             # 管理 API（NestJS + Fastify）
├── packages/
│   ├── charts/                # 无框架 ECharts 能力与公共类型
│   ├── database/              # Prisma Schema、迁移、生成 Client 与数据库类型
│   └── shared/                # 跨应用类型与无 UI 框架通用工具
├── scripts/
│   ├── templates/server/      # 可生成的 NestJS 服务底座
│   └── *.mjs                  # 启动、初始化、配置读取与模板测试脚本
├── docs/                      # 项目文档
├── .rules/                    # 开发规范
├── workspace.config.json      # 应用分类、路径、包名、本地端口与健康检查真相源
└── compose.yaml               # 本地 PostgreSQL 依赖
```

## 当前能力边界

已实现：

- 管理后台外壳：可折叠侧栏（含窄屏抽屉）、Header、工作台、404 页与设计 token 体系。
- 请求层：`AxiosFactory` + 独立服务实例 + 拦截器；认证注入待下一阶段。
- 管理 API：CORS 白名单、ValidationPipe、shutdown hooks、健康检查与应用级 Prisma 模块。
- 服务扩展：配置驱动的开发启动器与经过真实生成验证的 NestJS 服务模板。
- 工程基线：workspace catalog、Turborepo、ESLint、Prettier、Husky、commitlint 与 Rstest。

尚未实现：自动化部署工作流、业务 CRUD、C 端服务及主站。部署环境变量契约已经明确，但需要在确定 Docker、云平台或 SSH + PM2 等真实目标后实现对应 CI/CD，不能把未落地的流程算作现有能力。

## 文档

- 开发规范：`.rules/`（索引见 `AGENTS.md`）
- 环境配置：`docs/environment.md`
- Admin 多主题与 Element Plus 定制：[`docs/admin-theme.md`](docs/admin-theme.md)

LY Fullstack 项目组
