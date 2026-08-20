# LY Fullstack

全栈 Monorepo 骨架：管理后台（`apps/admin`）、C 端 API（`apps/api`）和管理 API（`apps/admin-api`），由 pnpm workspace 与 Turborepo 统一编排。

当前处于 **M1 工程骨架阶段**：Admin 外壳、两个 API 的健康检查、共享数据库包与工程基线已就绪；登录认证、五表 RBAC、C 端用户体系与业务 CRUD 将在后续阶段接入。

## 技术栈

| 端       | 选型                                                                |
| -------- | ------------------------------------------------------------------- |
| 管理后台 | Rsbuild 2 + Vue 3 + TypeScript + Element Plus + SCSS                |
| C 端 API | NestJS 11 + Fastify，默认端口 3000                                  |
| 管理 API | NestJS 11 + Fastify + ValidationPipe，默认端口 3001                 |
| 数据层   | `@repo/database` + PostgreSQL 17 + Prisma 7（driver adapter 模式）  |
| 共享包   | `@repo/shared`（前后端通用类型与无 UI 框架通用工具）                |
| 图表包   | `@repo/charts`（ECharts 按需注册、初始化与公共类型）                |
| 工程基线 | pnpm workspace + Turborepo + ESLint + Prettier + Husky + commitlint |
| 测试     | Rstest                                                              |

## 快速开始

环境要求：Node.js >= 22.19，pnpm >= 11 < 12（根目录 `packageManager` 已固定），Docker（仅本地 PostgreSQL）。

```bash
# 1. 安装依赖（会自动执行 prisma generate）
pnpm install

# 2. 启动本地 PostgreSQL（首次执行会创建命名卷）
docker compose up -d

# 3. 准备管理 API 环境文件
copy apps\admin-api\.env.example apps\admin-api\.env.development
# 默认值与 compose.yaml 中的 PostgreSQL 一致，本地开发可直接使用

# 4. 启动（并行启动 admin、api 与 admin-api）
pnpm dev
```

- 管理后台：http://localhost:8080
- C 端 API：http://localhost:3000/api/health
- 管理 API：http://localhost:3001/api/health

单独启动：`pnpm dev:admin`、`pnpm dev:api`、`pnpm dev:admin-api`。

## 常用命令

| 命令                 | 说明                                           |
| -------------------- | ---------------------------------------------- |
| `pnpm dev`           | 并行启动 Admin、C 端 API 与管理 API            |
| `pnpm dev:admin`     | 单独启动 admin                                 |
| `pnpm dev:api`       | 单独启动 C 端 api                              |
| `pnpm dev:admin-api` | 单独启动 admin-api                             |
| `pnpm typecheck`     | 全仓类型检查                                   |
| `pnpm lint`          | ESLint 检查（`lint:fix` 自动修复）             |
| `pnpm format`        | Prettier 格式化（`format:check` 仅检查）       |
| `pnpm test`          | Rstest 单元测试                                |
| `pnpm build`         | 构建全部产物                                   |
| `pnpm check`         | typecheck + lint + format:check + test + build |

## 目录结构

```text
ly-fullstack/
├── apps/
│   ├── admin/       # 管理后台（Rsbuild + Vue 3 + Element Plus）
│   ├── api/         # C 端 API（NestJS + Fastify）
│   └── admin-api/   # 管理 API（NestJS + Fastify）
├── packages/
│   ├── charts/      # 无框架 ECharts 能力与公共类型
│   ├── database/    # Prisma Schema、迁移、生成 Client 与数据库类型
│   └── shared/      # 前后端通用类型与无 UI 框架通用工具（当前含 HealthStatus）
├── docs/            # 阶段性文档（提取报告等）
├── .rules/          # 开发规范（按技术栈拆分）
└── compose.yaml     # 本地 PostgreSQL 依赖
```

## 当前能力边界

已实现：

- 管理后台外壳：可折叠侧栏（含窄屏抽屉）、Header、工作台、404 页与设计 token 体系。
- 请求层：`AxiosFactory` + 统一服务实例 + 拦截器（错误统一出口；认证注入待下一阶段）。
- C 端 API：独立 NestJS + Fastify 服务，默认端口 3000，当前只提供 `GET /api/health`。
- 管理 API：默认端口 3001，具备 CORS 白名单、ValidationPipe、shutdown hooks 和健康检查。
- Prisma 基线：Schema 与生成 Client 位于 `@repo/database`；admin-api 保留应用级 PrismaModule/PrismaService；无业务模型。
- 工程基线：workspace catalog、Turborepo 任务、ESLint/Prettier/Husky/commitlint、GitHub Actions CI。

未实现（下一阶段）：管理端登录与五表 RBAC、C 端用户 JWT、业务 CRUD，以及尚未进入范围的 `apps/web`。

## 文档

- 开发规范：`.rules/`（索引见 `AGENTS.md`）
- M1 提取报告：`docs/extraction-report.md`
- 第三方声明：`THIRD_PARTY_NOTICES.md`
