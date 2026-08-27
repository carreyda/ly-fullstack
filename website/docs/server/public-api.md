---
title: 默认 C 端 API
description: 说明 apps/api 为什么存在、当前三个匿名接口的调用方式、公共字典与配置的安全边界，以及如何连接真实客户端。
---

# 默认 C 端 API

`apps/api` 是独立 NestJS 应用，不是 `admin-api` 的子模块。它提供少量真正通用的公开能力，同时建立未来 C 端业务的服务端编码基线。

## 当前接口

| 方法 | 地址                             | 鉴权 | 说明                           |
| ---- | -------------------------------- | ---- | ------------------------------ |
| GET  | `/api/health`                    | 无   | 进程健康检查                   |
| GET  | `/api/public/dictionaries/:code` | 无   | 按编码读取启用字典及启用字典项 |
| GET  | `/api/public/configs/:key`       | 无   | 按键读取单条启用公共配置       |

本地启动：

```bash
pnpm dev:api
```

调用示例：

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/public/dictionaries/user_status
curl http://localhost:3001/api/public/configs/site.name
```

字典或字典项停用后不会进入公共响应。公共配置没有“读取全部配置”接口，只能按明确 key 获取单条数据。

## 先在后台维护数据

使用 Admin 登录后：

- 在“字典管理”创建字典与字典项，设置稳定编码并启用；
- 在“公共配置”创建公开配置，设置稳定 key 并启用；
- 再从 C 端 API 通过 code 或 key 精确读取。

管理接口由 RBAC 保护，公开读取接口无需登录。两者访问同一数据库，但暴露能力不同。

## 公共配置的安全边界

公共配置值默认对任何未登录用户可见。适合保存：

- 站点名称；
- 客服邮箱；
- 协议版本；
- 公开功能开关；
- 前端本来就需要展示的文案或地址。

禁止保存：

- 数据库密码和连接串；
- JWT、OAuth、短信或支付密钥；
- 对象存储 Secret；
- 内网地址；
- 任何只应由服务端读取的配置。

服务端秘密必须进入环境变量或部署平台 Secret。

## 连接真实客户端

Setup 生成的 `apps/api/.env.development` 默认示例 CORS 来源是 `http://localhost:3002` 和对应 `127.0.0.1` 地址。创建真实 Web 客户端后，应改成它的实际开发 Origin：

```dotenv
CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
```

只写 Origin，不带页面路径。多个来源使用英文逗号分隔。生产环境由平台注入真实 HTTPS Origin，不提交 `.env.production`。

## 当前没有什么

默认 API 不包含：

- 终端用户注册与登录；
- 刷新令牌、OAuth 或短信验证；
- 订单、支付、内容或其他具体领域；
- API 网关和微服务治理。

这些能力必须根据真实产品模型设计。不能直接复用管理端账号、JWT Guard 和权限体系。

更完整的实现边界可查看仓库专题文档：[默认 C 端 API](https://github.com/liangy0323/ly-fullstack/blob/main/docs/public-api.md)。
