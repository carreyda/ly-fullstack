---
title: 环境变量
description: 区分浏览器公开配置与服务端秘密，说明 Admin、Admin API、默认 API 在 development、test、production 的文件和注入方式。
---

# 环境变量

判断环境变量能否提交的标准不是文件名，而是它最终运行在哪里：进入浏览器构建的值都应视为公开；数据库、JWT 等服务端秘密永远不能进入前端产物或 Git。

## 环境责任表

| 应用      | 环境        | 配置来源                                   | 是否提交 |
| --------- | ----------- | ------------------------------------------ | -------- |
| Admin     | development | `apps/admin/.env.development`              | 是       |
| Admin     | test        | `apps/admin/.env.test`                     | 是       |
| Admin     | production  | `apps/admin/.env.production`，可被平台覆盖 | 是       |
| Admin API | development | `pnpm setup` 生成                          | 否       |
| Admin API | test        | CI 变量或本地私有文件                      | 否       |
| Admin API | production  | Secret、容器变量或服务器私有文件           | 否       |
| API       | development | `pnpm setup` 生成                          | 否       |
| API       | test        | CI 变量或本地私有文件                      | 否       |
| API       | production  | Secret、容器变量或服务器私有文件           | 否       |

## Admin 公开变量

```dotenv
APP_ENV=development
API_BASE_URL=http://127.0.0.1:3000/api
```

- `APP_ENV`：`development`、`test` 或 `production`。
- `API_BASE_URL`：管理 API 地址；生产通常使用同源 `/api`。

这些值会进入浏览器 JS，不能放数据库密码、JWT Secret 或第三方私钥。

## Admin API 秘密变量

```dotenv
DATABASE_URL="postgresql://..."
CORS_ORIGINS="https://admin.example.com"
JWT_SECRET="<高强度随机值>"
JWT_EXPIRES_IN="7d"
PORT="3000"
```

- `DATABASE_URL`：PostgreSQL 连接串，用户名和密码中的特殊字符需要 URL 编码。
- `CORS_ORIGINS`：允许访问管理 API 的精确浏览器 Origin。
- `JWT_SECRET`：生产独立随机密钥，泄露后立即轮换。
- `JWT_EXPIRES_IN`：Access Token 有效期。
- `PORT`：本地由启动器注入，部署由平台注入。

## 默认 API 变量

```dotenv
DATABASE_URL="postgresql://..."
CORS_ORIGINS="https://www.example.com"
PORT="3001"
```

默认 API 没有管理 JWT 变量。未来增加终端用户认证时，应建立自己的环境契约，不复用 `admin-api` 的秘密文件。

## 本地 Setup 的写入边界

`pnpm setup`：

- 只校验已提交的 Admin development API 地址；
- 生成两个服务端 `.env.development`；
- 不生成根 `.env`；
- 不生成 test 或 production 文件；
- 不把密码写入命令行或日志。

非交互模式通过进程环境传入：

```bash
SETUP_DATABASE_PASSWORD='<数据库密码>' \
SETUP_DATABASE_NAME='ly_fullstack_ci' \
SETUP_ADMIN_PASSWORD='<管理员密码>' \
pnpm run setup -- --non-interactive
```

CI 应从 Secret 注入这些值。非交互模式检测到已有服务端 `.env.development` 时会失败，避免静默覆盖。

## CORS 填写规则

正确：

```text
https://admin.example.com
https://www.example.com
http://localhost:8081
```

错误：

```text
https://admin.example.com/login   # 包含路径
admin.example.com                 # 缺少协议
*                                 # 无边界开放
```

多个 Origin 使用英文逗号分隔。协议、主机和端口任一不同，浏览器都视为不同 Origin。

更完整的维护约束见仓库专题文档：[环境配置](https://github.com/liangy0323/ly-fullstack/blob/main/docs/environment.md)。
