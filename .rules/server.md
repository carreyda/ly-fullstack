# NestJS 服务端规范

本规范适用于 `apps/admin-api` 以及通过 `pnpm new:server` 创建的 NestJS 服务。每个服务都可独立构建和部署，不得跨应用导入认证、Guard、会话或业务模块。

## 技术选型

- NestJS 11 + Fastify 5，不使用 Express。
- PostgreSQL 18 数据访问统一使用 Prisma 7 和 PostgreSQL driver adapter，数据库结构通过 migration 管理。
- 开发环境由 `tsx` 运行，NestJS 构造函数依赖必须显式使用 `@Inject(...)`，不能依赖 esbuild 不生成的装饰器类型元数据。
- TypeScript 业务源码的相对导入和 barrel 导出不写 `.js` 后缀；Prisma 生成 Client 的导入按生成器要求使用 `.js` 后缀。
- 编译配置参考 NestJS 常规模式：`module: "Node16"`、`moduleResolution: "Node16"`，server 子包不配置 `"type": "module"`。

## 目录结构

```text
apps/<service>/src/
├── main.ts                     # 启动入口
├── constants/                  # 服务端常量，barrel 导出
│   ├── index.ts
│   └── modules/
├── modules/                    # 业务模块
│   └── <module>/
│       ├── <module>.module.ts
│       ├── <module>.controller.ts
│       ├── <module>.service.ts
│       └── dto/
├── prisma/                     # PrismaService 与显式数据库模块
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/                     # 公共能力，后续按需补充
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   └── interceptors/
└── types/                      # 服务端内部私有类型，barrel 导出
    ├── index.ts
    └── modules/
```

`packages/database` 是数据库唯一真相源，统一放置 `schema.prisma`、migration、种子脚本、Prisma CLI 配置和生成 Client。需要数据库的服务只通过 `@repo/database` 使用数据库能力，不在应用目录复制 Schema 或生成类型。

Prisma Client 在安装、database typecheck 和 database build 前生成。修改 Schema 后执行 `pnpm --filter @repo/database build`，再重启消费它的 API 服务；生成目录不提交仓库，也不得手动修改。

## 模块组织原则

- 每个业务域一个模块目录。
- Controller 只负责路由、参数接收和响应声明，业务逻辑放 Service。
- DTO 放在模块内部的 `dto/` 目录。
- 公共能力如守卫、拦截器、过滤器、装饰器放 `common/`。
- 根模块只做模块装配，不承载业务逻辑。

## 类型声明归属

- 前后端通用的类型声明统一放在 `packages/shared`，由 web、admin、server 共同复用。
- 每个服务在自己的 `src/types` 维护内部私有类型，不重复定义 shared 中已经存在的类型。
- 服务端内部类型使用通用 barrel 模式：`types/index.ts` 统一出口，复杂领域再拆到 `types/modules/*.ts`。
- 不在 controller、service、module 等业务 `.ts` 文件内部直接声明可复用类型。
- 业务文件只消费类型；发现类型会被多个文件复用时，先移动到 `types/` 或 `packages/shared`，再从统一出口导入。

## 常量维护

- 服务端常量维护在各自应用的 `src/constants`，禁止跨应用源码导入。
- 常量使用通用 barrel 模式：`constants/index.ts` 统一出口，复杂领域再拆到 `constants/modules/*.ts`。
- 不在 controller、service、module、入口文件中散落魔法字符串或魔法数字。
- 超过两端都通用的常量统一放在 `packages/shared/src/constants`，不要在 server 内重复维护。
- 应用分类、路径、包名、本地端口与健康检查统一维护在根 `workspace.config.json`；服务源码必须读取必填的 `PORT`，不得再维护本地默认端口常量。
- `scripts/dev.mjs` 根据配置表选择应用、预检端口、注入 `PORT` 并管理进程；部署环境由容器或平台显式注入 `PORT`。
- 首次本地开发通过 `pnpm setup` 校验 Admin API 端口、初始化 PostgreSQL、创建数据库和种子数据，并生成 admin-api 的私有 `.env.development`。Admin 的三套公开环境配置直接提交；Admin API 的 test 配置由测试任务或 CI 注入，production 配置由 CD、容器或部署平台注入，任何包含数据库密码或 JWT 密钥的运行文件与根 `.env` 均不得提交。具体边界以 `docs/environment.md` 为准。

## 全局能力

- 全局路由前缀在 `main.ts` 统一设置为 `api`。
- 浏览器跨域来源通过对应 `.env.<环境>` 的 `CORS_ORIGINS` 白名单维护，前端开发服务器不代理 API。
- DTO 校验在 `main.ts` 统一注册 `ValidationPipe`，业务模块通过 class-validator 声明输入约束。
- 开发环境使用 `tsx`，不能依赖它生成 Controller 方法参数的装饰器类型元数据；新增 Controller 的 `@Body` 和 `@Query` 必须通过 `createDtoValidationPipe(DtoClass)` 显式传入 `expectedType`，确保开发与生产环境都执行相同的字段白名单、类型转换和 class-validator 校验。
- DTO 只负责请求结构校验；产品类型不可修改、已发布内容不可编辑等领域约束必须同时在 Service 显式校验，不能只依赖前端禁用或 DTO 字段白名单。
- 后续接入响应封装时，成功响应统一由全局拦截器包裹为 `ApiResponse`，业务 Controller 不手动拼 envelope。
- 后续接入异常处理时，错误响应统一由全局过滤器转换，避免在业务代码里重复 try/catch。

## 数据访问

- PostgreSQL ORM 统一使用 Prisma，禁止业务模块同时引入其他 ORM 或直接维护 `pg` 连接池。
- Schema、migration、生成 Client 与数据库衍生类型统一放在 `packages/database`。
- 每个实际访问数据库的 API 在自己的 `src/prisma` 维护 `PrismaService` 与 `PrismaModule`，不要把 NestJS 依赖放进 database 包。
- PostgreSQL driver adapter 只能在 `PrismaService` 和 seed 中创建；连接与空闲超时必须显式配置，业务模块不得直接实例化 adapter。
- Service 注入 `PrismaService` 访问数据库，不在 Controller 直接写查询。
- Prisma 生成类型只从 `@repo/database` 进入服务端；对外响应必须映射为安全类型后再进入 `packages/shared`，前端不得直接依赖 database。
