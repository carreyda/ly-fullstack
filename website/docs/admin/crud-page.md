---
title: 新增 CRUD 页面
description: 按 LY Fullstack 标准完成共享契约、Admin API、请求层、分页 composable、列表页面、表单弹窗、错误处理和测试。
---

# 新增 CRUD 页面

`apps/admin/src/views/system/role` 是当前完整 CRUD 范本。新增列表模块时应复用已有分页、筛选、表格、空状态和弹窗约定，不重新发明一套页面结构。

## 目标目录

以 `product` 为例：

```text
packages/shared/src/types/modules/admin-product.ts
apps/admin-api/src/modules/product/
apps/admin/src/api/modules/product/
apps/admin/src/views/product/
├── components/
│   └── product-form-dialog/
│       ├── composables/use-product-form.ts
│       └── index.vue
├── composables/
│   ├── use-product-management.test.ts
│   └── use-product-management.ts
└── index.vue
```

不要机械创建所有文件。没有页面私有组件时就不建 `components/`；逻辑简单且不会超过组件边界时也不需要无意义抽象。

## 1. 定义共享 HTTP 契约

先定义分页查询、列表项、详情、新增和编辑参数，再由前后端共同消费。分页使用已有：

```ts
PaginationParams;
PaginationResult<TItem>;
```

默认分页：

- `pageNum` 默认 1；
- `pageSize` 默认 20；
- 可选大小为 10、20、50、100；
- 服务端收到非法值应返回校验错误，不静默修正。

共享类型只包含跨网络需要的数据。数据库关联对象、密码摘要或内部字段不应进入响应契约。

## 2. 实现服务端模块

Controller：

- 声明路由和 HTTP 方法；
- 使用 DTO 校验输入格式；
- 声明权限码；
- 把已验证参数交给 Service。

Service：

- 处理唯一性、状态、关联和系统数据保护；
- 组合 Prisma 查询与事务；
- 把数据库结果映射为响应类型；
- 对可预期业务失败抛出明确异常。

DTO 的格式校验不能替代业务校验。例如字符串长度由 DTO 校验，而“编码是否重复”“系统记录能否删除”属于 Service。

## 3. 增加请求模块

`api.ts` 只维护路径：

```ts
export const API_ADMIN_PRODUCTS = '/products';

export const getAdminProductApi = (id: number): string => `${API_ADMIN_PRODUCTS}/${id}`;
```

`interface.ts` 使用现有管理 API 服务实例封装列表、创建、更新和删除。请求函数命名表达业务能力，不暴露 Axios 细节给页面。

最后从模块 `index.ts` 和 `src/api/index.ts` 聚合导出。

## 4. 使用统一分页状态

列表 composable 复用 `src/composables/use-pagination.ts`，统一管理：

- 当前页与每页数量；
- 筛选条件；
- 列表和总数；
- loading；
- 快速筛选时的请求竞态；
- 新增、编辑和删除后的刷新位置。

行为约定：

- 新增成功回到第一页；
- 编辑或关联变更刷新当前页；
- 删除当前页最后一条时自动回退上一页；
- 页面卸载后，旧请求不能回写已失效状态。

## 5. 组合标准页面结构

```text
页面根容器（flex column，100% 宽高）
└── 单一数据工作区（flex: 1；min-height: 0）
    ├── 标题栏：标题 + 主要操作
    ├── 筛选表单
    ├── 表格区域（flex: 1；min-height: 0）
    └── 底部分页
```

标题、筛选、表格和分页属于同一个数据工作区，通过分隔线和间距建立层级。不要拆成多张悬浮卡片。

使用现有组件和类名：

- 筛选：`DataFilterPanel`；
- 表格：`class="admin-table"`；
- 短状态：`BaseBadge`；
- 空数据：`BaseEmptyState`；
- 局部加载：`CircleLoading`。

## 6. 选择正确的表单容器

| 内容规模                     | 选择                                         |
| ---------------------------- | -------------------------------------------- |
| 字段少、高度稳定             | 普通 `el-dialog`                             |
| 居中语义但动态内容可能越界   | `el-dialog + use-dialog-size + el-scrollbar` |
| 多语言、富文本或持续纵向录入 | 右侧 `el-drawer + el-scrollbar`              |

短表单不要为了形式统一增加固定高度；大型表单也不要硬塞进居中弹窗。

表单组件通过 `defineExpose({ open })` 暴露最小命令式入口，内部负责初始化、校验、调用新增/编辑接口，并在成功后关闭和触发 `success`。

## 7. 处理异常和快速操作

至少处理：

- 接口失败后 loading 正确恢复；
- 删除确认期间不能重复提交；
- 多次快速筛选只采用最新结果；
- 弹窗关闭再打开不会残留上次表单和校验错误；
- 关联选项为空或加载失败时有可理解状态；
- 后端业务错误使用统一反馈，不在多层重复弹消息。

## 8. 权限同时保护 UI 与接口

列表、创建、编辑、删除和特殊关联操作分别使用明确权限码。页面根据会话权限隐藏操作，Admin API 同时使用 `@RequirePermissions` 校验。

如果“编辑角色”和“分配菜单”是两个业务动作，就使用两个权限码，不能因为它们在同一页面而合并。

## 9. 编写测试

前端 composable 至少覆盖分页、筛选、成功刷新、失败恢复和删除回退。服务端 Service 优先覆盖：

- 唯一性冲突；
- 系统数据保护；
- 关联删除保护；
- 复杂关系写入或事务失败；
- 状态变更边界。

完成后执行：

```bash
pnpm --filter @repo/admin typecheck
pnpm --filter @repo/admin test
pnpm --filter @repo/admin-api typecheck
pnpm --filter @repo/admin-api test
pnpm check
```
