---
title: 常见问题
description: 排查依赖安装、Setup、PostgreSQL、端口占用、登录、CORS、Prisma、SPA 404、旧资源缓存、文档构建与生产 502。
---

# 常见问题

排查时先确认错误发生在哪一层：依赖安装、数据库、应用启动、浏览器请求、权限、构建产物还是反向代理。不要一次修改多个环节。

## `pnpm install` 报版本不兼容

检查：

```bash
node --version
pnpm --version
```

要求 Node `>=22.19.0`、pnpm `>=11 <12`。执行 `corepack enable` 后重新进入终端，再安装依赖。不要通过忽略 engines 掩盖运行时不兼容。

## Setup 一直等待 PostgreSQL

Setup 会等待 `127.0.0.1:5432` 最多约 30 秒。检查：

- 本机 PostgreSQL 服务是否启动；
- Docker Desktop 是否运行；
- `docker compose version` 是否可用；
- 5432 是否被其他程序占用；
- 防火墙或安全软件是否阻止本地连接。

如果本机没有 PostgreSQL 且 Docker 不可用，脚本无法替你安装数据库。

## PostgreSQL 密码认证失败

已有本机服务或 Docker 数据卷会保留创建时的原密码。再次给 Compose 传新密码不会修改旧数据卷中的账号密码。

先确认连接的是本机安装还是容器，再使用对应原密码。不要为了快速解决而删除包含数据的 volume。

## Setup 提示将覆盖环境文件

说明 `apps/admin-api/.env.development` 或 `apps/api/.env.development` 已存在。继续会重新生成数据库连接和 Admin JWT Secret。

如果当前环境可用，选择取消；只有明确要切换本地数据库或重新初始化配置时才覆盖。覆盖 JWT Secret 会使已签发管理 Token 失效。

## 端口被占用

端口来源是 `workspace.config.json`。先停止仓库开发进程：

```bash
pnpm dev:stop
```

仍占用时查找实际进程，不要同时修改配置表和多个 `.env`。如果确实变更端口，只修改注册表，再运行 Setup 同步 Admin development API 地址。

## Admin 能打开，但登录请求失败

依次检查：

1. `http://localhost:3000/api/health` 是否可用；
2. `apps/admin/.env.development` 的 `API_BASE_URL` 是否指向 3000；
3. Admin API development 文件是否存在；
4. 浏览器 Network 中是网络失败、401、429 还是 CORS；
5. 服务端日志是否报告数据库或环境变量错误。

滑块挑战和登录凭证只能使用一次。过期或已经消费后应重新创建挑战，不要重复发送旧凭证。

## 浏览器报告 CORS

`CORS_ORIGINS` 必须与浏览器地址栏的 Origin 完全一致，包括协议和端口。`localhost` 与 `127.0.0.1` 不是同一 Origin。

修改服务端环境后重启对应 API。不要用 `*` 临时开放带认证的管理接口。

## 页面有菜单，但接口返回 403

数据库菜单可见性和接口权限码可能不一致。检查：

- 当前角色是否勾选具体操作权限；
- Controller 的 `@RequirePermissions` 是否使用同一权限码；
- 角色或菜单是否被停用；
- 当前会话是否已经通过 `/auth/me` 获取最新权限。

重新登录可以排除旧会话展示，但不能替代修复权限配置。

## Prisma 连接失败

检查 `DATABASE_URL`：

- 用户名、密码中的特殊字符是否 URL 编码；
- 主机、端口、数据库名是否正确；
- `?schema=public` 是否保留；
- 数据库账号是否有目标库权限；
- 生产数据库是否要求 SSL；
- 服务运行用户是否实际获得该环境变量。

不要把完整生产连接串粘贴到公开 Issue 或日志。

## 生产页面刷新后 404

Vue Router 使用 HTML5 history。Nginx 的站点路由需要：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

API `/api/` 代理要写在该规则之前并指向 Admin API。

## 发布后仍看到旧页面

检查：

- 新版本的 `version.json` 是否已经发布；
- `index.html`、`version.json`、`sw.js` 是否错误使用长期缓存；
- 哈希静态资源是否完整上传；
- CDN 是否还缓存旧入口；
- 浏览器是否存在旧 Service Worker。

不要只让用户手工清缓存；先修正服务器缓存策略和发布完整性。

## 生产出现 502

依次检查：

```bash
systemctl status <service>
journalctl -u <service> -n 200 --no-pager
curl --fail http://127.0.0.1:<port>/api/health
nginx -t
```

常见原因是 API 没启动、环境变量缺失、数据库不可达、端口与 `proxy_pass` 不一致或 Nginx 配置未重新加载。

## `pnpm docs:build` 失败

先看错误是否属于：

- Markdown frontmatter 格式；
- `_nav.json` / `_meta.json` JSON；
- 站内链接不存在；
- 图片相对路径错误；
- Rspress 配置类型错误。

修复后执行：

```bash
pnpm docs:build
pnpm docs:preview
```

`docs:preview` 用于检查构建产物和 `llms.txt`；开发模式不会生成 SSG-MD 文件。
