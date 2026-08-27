---
title: 项目边界
description: 汇总 LY Fullstack 的应用依赖、服务认证、数据库类型、图表、配置表和文档职责边界，避免扩展时破坏架构。
---

# 项目边界

下面的约束是项目可以长期维护的前提。`pnpm check:architecture` 会自动检查其中一部分，其余仍需要代码评审和测试保证。

## 依赖方向只能是 `apps → packages`

允许：

```text
apps/admin     → packages/shared
apps/admin     → packages/charts
apps/admin-api → packages/shared
apps/admin-api → packages/database
apps/api       → packages/shared
apps/api       → packages/database
```

禁止：

- `packages/shared` 导入任意 `apps/*` 源码；
- 一个应用直接导入另一个应用内部文件；
- 为了少写几行代码，把页面组件或 NestJS Service 塞进共享包。

共享包必须比应用更稳定、更通用。只有存在真实跨应用消费者时才上移代码。

## Admin API 与 C 端 API 的认证不能混用

`admin-api` 面向后台管理员，使用管理账号、角色、菜单、权限码与 `tokenVersion`。`api` 面向未来真实终端产品，当前没有终端用户认证。

不要把 Admin JWT Guard 复制或导入 `api`。未来 C 端用户可能需要手机号、OAuth、设备、刷新令牌、会员状态或租户隔离，安全模型必须按真实需求独立设计。

## 数据库是服务端专用能力

`@repo/database` 可以被 NestJS 服务使用，不能被 `apps/admin` 或未来浏览器应用导入。

原因包括：

- Prisma Client 只能运行在服务端环境；
- 数据库模型可能包含不应暴露的字段；
- 数据库结构与公开 API 契约的变更节奏不同；
- 浏览器不应知道数据库连接和内部关系细节。

## Prisma 类型不得直接穿透到前端

服务端从 Prisma 结果显式映射出响应对象，并使用 `@repo/shared/types` 中的安全类型作为跨端契约。前端不依赖 `packages/database/generated/prisma`。

新增字段时先问：它是否真的需要传给浏览器？如果不需要，就不要因为“类型已经存在”而暴露。

## `packages/charts` 不承载业务组件

公共包只注册 ECharts 模块、提供初始化函数和公共类型。具体图表标题、颜色策略、接口数据转换、ResizeObserver 和 Vue 生命周期留在 Admin。

这样既能复用较重的 ECharts 基础能力，又不会把某个页面的业务语义变成全仓依赖。

## 应用注册表是本地运行真相源

新增应用的名称、路径、包名、端口和健康检查写入 `workspace.config.json`。不要再在：

- `.env.development` 写同一份默认端口；
- `scripts/dev.mjs` 手工增加分支；
- README 单独维护一份无法校验的应用列表。

服务生成器会自动注册；手动增加 Web 应用时需要同步更新配置表并满足 Schema。

## 根 `docs/` 与 `website/` 各有职责

- `docs/`：工程专题、实现机制和维护者真相源。
- `website/`：面向使用者的任务式官方文档。
- `.rules/`：编码规范。
- `README.md`：项目门面和最短入口。

文档站可以链接专题文档，但不要复制一份后各自演化。修改机制时先更新真相源，再更新对外使用说明。

## 架构检查不是全部保障

运行：

```bash
pnpm check:architecture
```

它能检查已编码的依赖和目录规则，但无法判断业务设计是否合理。认证边界、响应字段安全、事务、一致性和权限语义仍需要测试与评审。
