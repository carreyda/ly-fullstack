---
title: 新增业务模块
description: 在 apps/api 中按 NestJS 领域模块增加 DTO、Controller、Service、Prisma 查询、共享响应类型与单元测试，并接入根模块。
---

# 新增业务模块

真实业务与默认 API 使用相同部署边界时，直接在 `apps/api/src/modules` 增加领域模块。以下以公开文章查询为结构示例。

## 1. 设计接口而不是复制数据库表

先定义调用者需要的用例：

```text
GET /api/articles          获取已发布文章列表
GET /api/articles/:slug    按 slug 获取已发布文章详情
```

不要因为 Prisma 模型有 20 个字段，就把 20 个字段全部返回。公开接口只暴露客户端需要且允许公开的数据。

## 2. 创建模块目录

```text
apps/api/src/modules/article/
├── dto/
│   └── article-query.dto.ts
├── article.controller.ts
├── article.module.ts
├── article.service.test.ts
└── article.service.ts
```

如果响应类型会被客户端共同消费，把它放入 `packages/shared/src/types/modules/` 并从类型入口聚合导出。只在服务内部使用的查询辅助类型留在 `apps/api/src/types`。

## 3. DTO 负责请求格式

DTO 校验页码、每页大小、枚举、长度和可选字段。它不负责“文章是否已发布”“当前时间是否允许展示”等领域判断。

公开列表必须限制分页上限，避免匿名调用一次读取过多数据。

## 4. Service 负责业务规则

Service 注入当前应用的 `PrismaService`：

- 查询时强制附加发布状态；
- 使用稳定排序；
- 只选择公开字段；
- 把 Prisma 结果映射为响应契约；
- 找不到公开记录时返回明确的 404 语义。

不要在 Controller 中直接访问 Prisma，也不要从 `apps/admin-api` 导入已有 Service。管理用例和公开用例的字段、权限与错误语义不同。

## 5. Controller 负责 HTTP 边界

Controller 声明路由、解析参数并调用 Service。项目使用全局 `/api` 前缀，所以 Controller 写 `articles` 即得到 `/api/articles`。

开发环境使用 `tsx`。新增 `@Query` 或 `@Body` DTO 时，按 `.rules/server.md` 使用项目的 DTO Validation Pipe 显式传入类型，不能只依赖装饰器元数据。

## 6. 注册模块

把 `ArticleModule` 加入 `apps/api/src/modules/app/app.module.ts` 的 `imports`。根模块只做装配，不在里面写查询或业务判断。

## 7. 编写测试

Service 测试至少覆盖：

- 只返回已发布数据；
- 不泄露内部字段；
- 空列表和不存在详情；
- 分页与稳定排序；
- Prisma 抛错时异常不被吞掉。

Controller 或端到端测试再覆盖 DTO 拒绝非法输入，以及公开路径确实不依赖管理 JWT。

## 8. 验证

```bash
pnpm --filter @repo/api typecheck
pnpm --filter @repo/api test
pnpm --filter @repo/api build
pnpm check:architecture
```

启动后再用真实 HTTP 请求验证：

```bash
pnpm dev:api
curl "http://localhost:3001/api/articles?pageNum=1&pageSize=20"
```

## 什么时候不要放进默认 API

当功能已经明确需要独立发布、资源隔离或团队自治时，阅读[创建独立服务](/server/create-service)。仅仅因为目录文件变多，不是拆服务的充分理由；先按领域模块保持内部边界。
