---
title: 生产部署
description: 使用锁定版本构建 Admin 与两个 NestJS 服务，配置生产环境、Prisma migration、Systemd、Nginx、HTTPS、验收、升级和回滚。
---

# 生产部署

本页给出 Linux + PostgreSQL + Systemd + Nginx 的基准流程。容器或云平台可以采用不同实现，但环境变量、迁移顺序、健康检查、缓存和安全边界保持一致。

完整可复制的配置见仓库专题运行手册：[生产部署](https://github.com/liangy0323/ly-fullstack/blob/main/docs/deployment.md)。

## 1. 准备版本与运行用户

使用专用低权限用户运行应用，不用 root。每个版本放在独立目录：

```text
/srv/ly-fullstack/
├── releases/<version>/
└── current -> releases/<version>
```

从明确 Tag 或 Commit 获取代码，保留完整锁文件。不要把开发者持续变化的工作目录直接作为生产目录。

## 2. 注入生产环境

Admin 默认生产配置使用同源 `/api`。如果管理 API 使用独立域名，在构建阶段覆盖 `API_BASE_URL`。

Admin API 必需：

```text
APP_ENV=production
PORT=3000
DATABASE_URL=<生产连接串>
CORS_ORIGINS=https://admin.example.com
JWT_SECRET=<生产随机密钥>
JWT_EXPIRES_IN=7d
```

默认 API 必需：

```text
APP_ENV=production
PORT=3001
DATABASE_URL=<生产连接串>
CORS_ORIGINS=https://www.example.com
```

环境文件只允许部署用户读取，或者直接由容器/云平台 Secret 注入。不能提交到仓库或打进 Admin 静态资源。

## 3. 安装、检查和构建

```bash
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` 已包含业务产物和官方文档站构建。发布的产物必须来自同一个已经通过检查的 Commit。

主要产物：

```text
apps/admin/dist/
apps/admin-api/dist/
apps/api/dist/
website/doc_build/
```

是否同时发布官方文档站由你的域名规划决定，但它的构建失败会阻止质量门禁通过。

## 4. 执行数据库迁移

在切换应用版本前加载生产 `DATABASE_URL`：

```bash
pnpm --filter @repo/database db:migrate
```

迁移失败立即停止。新数据库首次部署再执行 Seed，并通过进程环境提供独立强管理员密码；已有数据库不要用 Seed 重置账号。

## 5. 启动 API

两个 API 使用独立 Systemd 单元，工作目录分别是：

```text
/srv/ly-fullstack/current/apps/admin-api
/srv/ly-fullstack/current/apps/api
```

启动命令分别为：

```bash
node dist/main.js
```

Systemd 应配置：

- 专用用户和组；
- 对应 `EnvironmentFile`；
- `Restart=on-failure`；
- SIGTERM 与合理停止超时；
- `NoNewPrivileges=true` 等基础隔离。

启动后先从本机验证：

```bash
curl --fail http://127.0.0.1:3000/api/health
curl --fail http://127.0.0.1:3001/api/health
```

## 6. 配置 Nginx

管理域名：

- 站点根目录指向 `apps/admin/dist`；
- `/api/` 代理到 `127.0.0.1:3000`；
- SPA 路由使用 `try_files $uri $uri/ /index.html`；
- 传递 `Host`、`X-Real-IP`、`X-Forwarded-For` 和 `X-Forwarded-Proto`。

公共 API 推荐独立域名，把全部 `/api/` 请求代理到 `127.0.0.1:3001`。不要在同一个域名的同一个 `/api/` 位置同时代理两个上游。

## 7. 设置缓存

Admin 包含版本检测与 Service Worker：

- `index.html`：不缓存；
- `version.json`：不缓存；
- `sw.js`：不长期缓存；
- 带内容哈希的 JS、CSS、字体和图片：长期 immutable 缓存。

如果入口或版本清单被长期缓存，用户可能无法及时发现新版本；如果哈希资源不缓存，则会浪费带宽和加载时间。

完整机制见[Admin 版本检测与离线缓存](https://github.com/liangy0323/ly-fullstack/blob/main/docs/admin-version-offline.md)。

## 8. 启用 HTTPS

生产登录密码和 JWT 只能通过 HTTPS 传输。可以使用 Certbot、云负载均衡或公司证书平台；证书未生效前不要开放登录入口。

Admin API 当前只信任 loopback 反向代理传入的地址信息。不要把 3000 端口直接暴露公网后仍假设任意转发头可信。

## 9. 发布验收

```bash
curl --fail https://admin.example.com/
curl --fail https://admin.example.com/version.json
curl --fail https://admin.example.com/api/health
curl --fail https://api.example.com/api/health
```

浏览器继续验证：

1. 未登录访问受保护页会跳转登录。
2. 管理员可以完成滑块、登录和刷新恢复。
3. 用户、角色、菜单、字典和公共配置可读取。
4. 受限角色的接口权限返回正确。
5. 深浅主题和静态资源加载正常。
6. 控制台没有 CORS、旧 Chunk 或 Service Worker 错误。

## 10. 升级与回滚

升级：

1. 新版本进入新的 release 目录。
2. 安装、检查、构建。
3. 备份并执行向前 migration。
4. 切换 `current` 软链接。
5. 重启两个 API，检查健康状态。
6. 重新加载 Nginx 并完成浏览器验收。

代码回滚可以把软链接切回上一版本并重启服务。数据库不会随代码自动回滚；破坏性变更必须提前采用兼容迁移策略。

## 备份底线

- PostgreSQL 每日自动备份；
- migration 前创建可恢复快照；
- 定期进行真实恢复演练；
- 秘密配置进入受控加密备份；
- 至少保留上一份已验证应用版本。

没有恢复演练的备份不能视为可靠备份。
