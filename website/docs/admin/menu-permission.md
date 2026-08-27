---
title: 菜单与权限接入
description: 将新的 Vue 页面注册到静态路由，再通过数据库菜单、标准权限、角色授权和服务端 Guard 完成可验证的 RBAC 闭环。
---

# 菜单与权限接入

新增页面后还需要接入静态路由、数据库菜单和接口权限。三者解决不同问题，不能互相替代。

## 1. 注册静态路由

在 `apps/admin/src/router/modules/` 的合适模块中增加叶子路由：

```ts
{
  path: 'product',
  name: 'content-product',
  component: () => import('@/views/content/product/index.vue'),
  meta: {
    title: '产品管理',
    pageBinding: {
      component: 'content/product/index',
      permissionPrefix: 'content:product',
    },
  },
}
```

字段含义：

- `name`：稳定、唯一的 Vue Router 名称；
- `title`：页面标题和菜单选择器标签；
- `pageBinding.component`：数据库菜单保存的页面绑定标识；
- `permissionPrefix`：标准操作权限的前缀。

只有声明 `pageBinding` 的路由才会由 `createAdminPageOptions` 派生到菜单管理页面。不要另外维护一份页面常量表。

## 2. 在菜单管理创建入口

使用超级管理员登录，进入“系统管理 → 菜单管理”：

1. 选择或创建合适的父级目录。
2. 创建菜单并选择刚注册的页面。
3. 配置名称、图标、排序和状态。
4. 保存后确认菜单树中的路径和页面绑定正确。

图标从项目维护的 Lucide 白名单选择。不要在数据库存任意组件代码或未经约束的图标表达式。

## 3. 创建操作权限

对标准 CRUD 页面，可以基于 `permissionPrefix` 生成标准权限，再按业务补充特殊动作。例如：

```text
content:product:list
content:product:create
content:product:update
content:product:delete
content:product:publish
```

权限码表达业务动作，不表达按钮位置。即使未来把“发布”从表格行按钮移动到详情页，权限码也不应改变。

## 4. 在 Admin API 声明权限

Controller 的每个受保护接口使用对应权限：

```ts
@RequirePermissions('content:product:create')
@Post()
create(@Body() params: CreateProductDto) {
  return this.productService.create(params);
}
```

列表接口同样需要权限，不能只保护写操作。公共读取能力应该放在 `apps/api` 并按公开数据边界单独实现，而不是把管理列表改成匿名接口。

## 5. 在页面控制操作入口

页面从认证 Store 的权限集合判断按钮是否展示。隐藏无权按钮可以减少误操作，但不是安全边界。

不要在多个页面手写不同的超级管理员特判。超级管理员的全权限由 Admin API 会话组装逻辑统一保证。

## 6. 分配角色与用户

1. 在角色管理创建或编辑业务角色。
2. 打开菜单授权，勾选页面和允许的操作权限。
3. 在用户管理把角色分配给测试账号。
4. 重新获取该账号会话后验证菜单与按钮。

角色基础信息和菜单授权是两个独立写入动作，也使用不同权限码。系统内置超级管理员角色受到服务端保护。

## 7. 验收正反两条路径

有权账号：

- 看得到菜单；
- 能打开页面；
- 看得到被授权操作；
- API 返回成功。

无权账号：

- 看不到菜单和操作按钮；
- 即使知道页面地址，也不能完成受限操作；
- 直接请求受限 API 返回 `403`。

如果只验证页面隐藏，没有验证接口拒绝，权限功能还没有完成。

## 常见错误

| 现象                     | 原因                         | 处理                              |
| ------------------------ | ---------------------------- | --------------------------------- |
| 菜单管理找不到新页面     | 路由没有 `meta.pageBinding`  | 补齐页面绑定元数据                |
| 页面能打开但侧栏没有入口 | 数据库未创建菜单或角色未授权 | 创建菜单并重新分配角色            |
| 按钮隐藏但接口仍可调用   | Controller 缺少权限声明      | 增加 `@RequirePermissions` 和测试 |
| 改完角色后仍看到旧状态   | 浏览器还未恢复最新会话       | 重新登录或触发 `/auth/me`         |
| 所有人都被拒绝           | 权限码前缀或动作拼写不一致   | 对照路由、数据库菜单和 Controller |
