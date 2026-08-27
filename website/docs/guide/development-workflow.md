---
title: 开发第一个业务
description: 从业务边界判断到数据库、共享契约、NestJS 模块、Admin 页面、权限菜单、测试与质量门禁，完整演示项目开发顺序。
---

# 开发第一个业务

新功能不要从“先建一个 Vue 页面”开始。LY Fullstack 推荐先判断业务属于哪个运行边界，再沿数据库、契约、接口、页面和权限逐层完成。

以下以“内容管理”为例，只说明开发路径，不预设你的字段和业务规则。

## 1. 先定义最小业务闭环

在写代码前明确：

- 谁创建、查看、修改和删除内容；
- 哪些字段属于数据库，哪些是展示计算值；
- 管理员和终端用户看到的数据是否相同；
- 是否需要状态流转、唯一约束、审计或软删除；
- 该功能与现有应用一起部署是否足够。

如果只有后台管理员维护内容，而 C 端公开读取内容，通常可以：

- 在 `admin-api` 增加管理 CRUD；
- 在 `api` 增加公开查询；
- 两者共享 `@repo/database`，但分别设计响应 DTO；
- 在 `admin` 增加内容管理页面。

这仍然是模块化单体，不需要新建服务。

## 2. 读取对应开发规则

至少阅读：

- `.rules/comment-style.md`：所有任务都必须遵守；
- `.rules/server.md`、`.rules/typescript.md`：服务端和类型边界；
- `.rules/admin.md`、`.rules/vue3.md`：后台 CRUD 页面；
- `.rules/axios.md`、`.rules/error-handling.md`：接口接入和错误处理；
- `.rules/code-review.md`：完成前检查内存泄漏与容错。

不要把规则全文复制进新文档或提示词。`AGENTS.md` 是统一入口，仓库中的规则才是最新真相源。

## 3. 修改数据库模型

在 `packages/database/prisma/schema.prisma` 增加领域模型、索引和关系，然后生成 migration。开发阶段应使用 Prisma 的 migration 工作流生成可审查的 SQL；部署阶段只执行已有 migration，不能在线上临时推送 Schema。

完成后检查：

- 唯一约束是否表达真实业务规则；
- 查询字段是否需要索引；
- 删除父记录时的关系行为是否明确；
- 新字段对已有数据是否兼容；
- migration 是否可以在当前数据规模下安全执行。

数据库操作详见[数据库与迁移](/server/database)。

## 4. 定义跨端契约

确实会被多个应用消费的请求或响应类型放入 `packages/shared/src/types`，并通过该目录的 `index.ts` 聚合导出。

不要把 Prisma 生成类型直接暴露给 Admin：

- 数据库记录可能包含密码摘要、内部标记或未来不稳定字段；
- API 返回结构需要独立版本边界；
- 前端不应依赖服务端专用生成目录。

只在服务内部使用的查询参数、数据库映射类型和辅助类型，应留在对应服务模块。

## 5. 实现管理 API

在 `apps/admin-api/src/modules/content/` 建立独立 NestJS 模块，保持 Controller、Service、DTO 和测试职责清晰：

```text
content/
├── dto/
│   ├── content-query.dto.ts
│   ├── create-content.dto.ts
│   └── update-content.dto.ts
├── content.controller.ts
├── content.module.ts
├── content.service.ts
└── content.service.test.ts
```

Controller 负责路由、DTO 验证、当前管理员和权限声明；Service 负责业务规则、数据库读写和安全响应映射。不要把分页查询、唯一性判断或事务直接堆进 Controller。

每个需要授权的接口通过 `@RequirePermissions(...)` 声明权限码。仅在页面隐藏按钮不构成权限控制，服务端 `PermissionGuard` 必须能拒绝无权请求。

## 6. 实现公开 API

如果 C 端需要读取内容，在 `apps/api/src/modules/content/` 单独实现公开查询。不要从 `admin-api` 导入 Controller、Guard 或 Service。

公开接口需要重新审查字段：

- 只返回已发布内容；
- 不返回内部备注、操作者信息或私密配置；
- 分页和排序有明确上限；
- 查询条件不能允许绕过状态限制。

两个应用可以复用数据库模型和安全的共享类型，但认证边界、DTO 与业务用例保持独立。

## 7. 接入 Admin 请求层

在 `apps/admin/src/api/modules/content/` 分离：

- `api.ts`：只维护接口路径和路径生成函数；
- `interface.ts`：维护调用函数、参数与返回类型；
- `index.ts`：聚合导出。

请求函数复用现有 Admin API 服务实例。组件不直接创建 Axios，不重复实现 Token 注入、401 处理或消息提示。

## 8. 实现后台页面

页面位于 `apps/admin/src/views/content/`。CRUD 页面通常包含：

- 页面入口 `index.vue`；
- 页面状态与业务动作 `composables/use-content-management.ts`；
- 新增/编辑弹窗组件及其私有 composable；
- 与源码同目录的 `*.test.ts`。

组件只负责渲染、表单交互和事件连接。分页、筛选、加载竞态、删除后页码修正、快速重复提交等逻辑放进 composable 或 helper。

具体页面结构见[新增 CRUD 页面](/admin/crud-page)。

## 9. 注册路由、菜单和权限

前端路由和数据库菜单承担不同职责：

- Vue Router 决定页面是否存在、加载哪个组件；
- 数据库菜单决定当前账号能看到什么导航，以及拥有哪组权限码；
- 服务端 Guard 决定接口能否真正执行。

先注册静态页面，再在菜单管理中创建对应目录/菜单，并生成标准操作权限。最后把菜单分配给角色、把角色分配给测试用户，分别验证有权和无权路径。

完整链路见[菜单与权限接入](/admin/menu-permission)。

## 10. 验证完整闭环

先运行受影响范围的测试，再执行全仓门禁：

```bash
pnpm --filter @repo/admin-api test
pnpm --filter @repo/api test
pnpm --filter @repo/admin test
pnpm check
```

功能验收至少包括：

1. 正常分页、筛选、新增、编辑和删除。
2. 空数据、接口失败和重复提交有明确表现。
3. 受限角色看不到菜单和操作入口。
4. 受限角色直接调用接口得到 `403`。
5. 深浅主题、窄屏布局和弹窗状态正常。
6. 切换页面后没有遗留监听、定时器、请求回写或重复提示。

只有页面、接口、权限和测试共同闭环，才算完成一个真实业务模块。
